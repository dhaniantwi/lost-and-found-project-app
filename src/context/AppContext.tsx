import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ItemReport, Claim, StudentUser, AuditLog, ItemStatus, ClaimStatus, MatchSuggestion, UserNotification } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  items: ItemReport[];
  claims: Claim[];
  users: StudentUser[];
  currentUser: StudentUser | null;
  authUser: User | null;
  auditLogs: AuditLog[];
  matchSuggestions: MatchSuggestion[];
  notifications: UserNotification[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, flow: 'signup' | 'magiclink') => Promise<void>;
  signUp: (details: { email: string; password: string; fullName: string; studentId: string; phone: string; hallOfResidence: string; department: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  addItemReport: (report: Omit<ItemReport, 'id' | 'dateReported' | 'status' | 'claimsCount'> & { mediaFiles?: File[] }) => Promise<ItemReport>;
  updateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>;
  deleteItemReport: (itemId: string) => Promise<void>;
  deleteClaim: (claimId: string) => Promise<void>;
  submitClaim: (claimData: { itemId: string; itemTitle: string; itemCategory: any; itemCampusLocation: string; proofDescription: string; proofDocumentFile?: File }) => Promise<Claim>;
  reviewClaim: (
    claimId: string,
    status: ClaimStatus,
    adminNotes: string,
    collectionLocation?: string,
    recipientIdVerified?: boolean,
    handoverNotes?: string,
    handoverCode?: string,
    handoverEvidenceFile?: File
  ) => Promise<void>;
  markItemRecovered: (itemId: string) => Promise<void>;
  reviewMatchSuggestion: (suggestionId: string, decision: 'approved' | 'rejected', notes: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapProfile = (row: any): StudentUser => ({
  id: row.id,
  studentId: row.student_id || '',
  fullName: row.full_name || 'UCC Student',
  email: row.email || '',
  phone: row.phone || '',
  hallOfResidence: row.hall_of_residence || '',
  department: row.department || '',
  role: row.role === 'admin' ? 'admin' : 'student',
  joinedDate: row.created_at || new Date().toISOString()
});

const uploadDataUrl = async (bucket: string, userId: string, value?: string) => {
  if (!value || !value.startsWith('data:')) return value || null;
  const response = await fetch(value);
  const blob = await response.blob();
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : blob.type === 'application/pdf' ? 'pdf' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false
  });
  if (error) throw error;
  return path;
};

const signedUrl = async (bucket: string, path?: string | null) => {
  if (!path) return undefined;
  if (/^(https?:|data:|\/)/.test(path)) return path;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
};

// Item photos live in a private bucket. Signed URLs are issued only when the
// current user passes the storage policy (report owner or CampusFind admin).
const privateItemPhotoUrl = async (path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith('data:')) return path;

  // Convert legacy public Storage URLs into private object paths after the bucket
  // is made private. Keep unrelated external legacy URLs unchanged.
  const publicMarker = '/storage/v1/object/public/item-photos/';
  const markerIndex = path.indexOf(publicMarker);
  let objectPath = path;
  if (markerIndex >= 0) {
    objectPath = decodeURIComponent(path.slice(markerIndex + publicMarker.length).split('?')[0]);
  } else if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return signedUrl('item-photos', objectPath);
};

const generateCollectionCode = () => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(value[0] % 100000000).padStart(8, '0');
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemReport[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [users, setUsers] = useState<StudentUser[]>([]);
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    window.setTimeout(() => setNotification((current) => current === msg ? null : current), 4500);
  }, []);

  useEffect(() => {
    // Remove obsolete browser-only demo records from earlier CampusFind builds.
    try {
      ['campusfind_items_v1', 'campusfind_claims_v1', 'campusfind_users_v1', 'campusfind_current_user_id_v1', 'campusfind_logs_v1']
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) showNotification(error.message);
      setAuthUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [showNotification]);

  const refreshData = useCallback(async () => {
    if (!authReady) return;
    setLoading(true);
    try {
      let profileRows: any[] = [];
      let profile: StudentUser | null = null;

      if (authUser) {
        const { data: ownProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (ownProfile) {
          profile = mapProfile({ ...ownProfile, email: authUser.email || '' });
          profileRows = [profile];
          if (profile.role === 'admin') {
            const { data: allProfiles, error: usersError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (usersError) throw usersError;
            profileRows = (allProfiles || []).map((row: any) => mapProfile(row));
          }
        }
      }

      const { data: reportRows, error: reportsError } = authUser
        ? await supabase.from('item_reports')
            .select('id, reporter_id, type, title, category, description, campus_location, date_event, color, image_path, media_path_2, media_type, media_type_2, status, reward_offered, claims_count, resolution_date, created_at')
            .order('created_at', { ascending: false })
        : await supabase.from('item_catalog')
            .select('*')
            .order('created_at', { ascending: false });
      if (reportsError) throw reportsError;

      let privateRows: any[] = [];
      if (authUser) {
        const { data, error } = await supabase.from('report_private_details').select('*');
        if (error) throw error;
        privateRows = data || [];
      }

      const profileById = new Map(profileRows.map((person: any) => [person.id, person]));
      const privateByItem = new Map(privateRows.map((row: any) => [row.item_id, row]));
      const mappedItems = await Promise.all((reportRows || []).map(async (row: any) => {
        const owner = profileById.get(row.reporter_id) as StudentUser | undefined;
        const ownRecord = authUser?.id === row.reporter_id;
        const privateDetails = privateByItem.get(row.id);
        const firstMediaUrl = await privateItemPhotoUrl(row.image_path);
        const secondMediaUrl = await privateItemPhotoUrl(row.media_path_2);
        return {
          id: row.id,
          type: row.type,
          title: row.title,
          category: row.category,
          description: row.description,
          campusLocation: row.campus_location,
          specificSpot: privateDetails?.specific_spot || undefined,
          dateEvent: row.date_event,
          dateReported: row.created_at,
          color: row.color,
          distinctMarks: privateDetails?.distinct_marks || undefined,
          storageLocation: privateDetails?.storage_location || undefined,
          imageUrl: row.media_type === 'video' ? undefined : firstMediaUrl,
          mediaItems: [
            ...(firstMediaUrl ? [{ url: firstMediaUrl, type: row.media_type === 'video' ? 'video' as const : 'image' as const }] : []),
            ...(secondMediaUrl ? [{ url: secondMediaUrl, type: row.media_type_2 === 'video' ? 'video' as const : 'image' as const }] : [])
          ],
          reporterName: owner?.fullName || (ownRecord ? profile?.fullName : 'UCC student'),
          reporterStudentId: owner?.studentId || (ownRecord ? profile?.studentId : ''),
          reporterEmail: owner?.email || (ownRecord ? authUser?.email || '' : ''),
          reporterPhone: owner?.phone || (ownRecord ? profile?.phone : ''),
          reporterHall: owner?.hallOfResidence || (ownRecord ? profile?.hallOfResidence : ''),
          status: row.status,
          claimsCount: row.claims_count || 0,
          rewardOffered: row.reward_offered || undefined,
          rewardCommitmentConfirmed: row.reward_commitment_confirmed === true,
          resolutionDate: row.resolution_date || undefined
        } as ItemReport;
      }));

      const itemById = new Map(mappedItems.map((item) => [item.id, item]));
      let mappedClaims: Claim[] = [];
      if (authUser) {
        const { data: claimRows, error: claimsError } = await supabase.from('claims').select('*').order('submitted_at', { ascending: false });
        if (claimsError) throw claimsError;
        mappedClaims = await Promise.all((claimRows || []).map(async (row: any) => {
          const claimant = profileById.get(row.claimant_id) as StudentUser | undefined;
          const item = itemById.get(row.item_id);
          return {
            id: row.id,
            claimantId: row.claimant_id,
            itemId: row.item_id,
            itemTitle: item?.title || 'Campus item',
            itemCategory: item?.category || 'Other',
            itemCampusLocation: item?.campusLocation || '',
            claimantName: claimant?.fullName || (row.claimant_id === authUser.id ? profile?.fullName : undefined) || 'UCC student',
            claimantStudentId: claimant?.studentId || (row.claimant_id === authUser.id ? profile?.studentId : '') || '',
            claimantEmail: claimant?.email || (row.claimant_id === authUser.id ? authUser.email || '' : ''),
            claimantPhone: claimant?.phone || (row.claimant_id === authUser.id ? profile?.phone : '') || '',
            claimantHall: claimant?.hallOfResidence || (row.claimant_id === authUser.id ? profile?.hallOfResidence : '') || '',
            proofDescription: row.proof_description,
            proofDocumentUrl: await signedUrl('claim-evidence', row.proof_document_path),
            status: row.status,
            adminNotes: row.admin_notes || undefined,
            submittedAt: row.submitted_at,
            reviewedAt: row.reviewed_at || undefined,
            reviewedBy: row.reviewed_by ? (profileById.get(row.reviewed_by) as StudentUser | undefined)?.fullName : undefined,
            collectionLocation: row.collection_location || undefined,
            collectionCode: row.collection_code || undefined,
            collectionCodeExpiresAt: row.collection_code_expires_at || undefined,
            collectionCodeIssuedAt: row.collection_code_issued_at || undefined,
            collectionCodeUsedAt: row.collection_code_used_at || undefined,
            collectionCodeLast4: row.collection_code_last4 || undefined,
            collectedAt: row.collected_at || undefined,
            collectedBy: row.collected_by || undefined,
            recipientIdVerified: row.recipient_id_verified || false,
            handoverNotes: row.handover_notes || undefined,
            handoverEvidenceUrl: await signedUrl('claim-evidence', row.handover_evidence_path)
          };
        }));
      }

      let suggestions: MatchSuggestion[] = [];
      if (profile?.role === 'admin') {
        const { data: suggestionRows, error: suggestionsError } = await supabase
          .from('match_suggestions')
          .select('id, lost_report_id, found_report_id, score, evidence, status, created_at, reviewed_at, review_notes')
          .order('score', { ascending: false })
          .order('created_at', { ascending: false });
        if (suggestionsError) throw suggestionsError;
        suggestions = (suggestionRows || []).map((row: any) => ({
          id: row.id,
          lostReportId: row.lost_report_id,
          foundReportId: row.found_report_id,
          score: row.score,
          evidence: Array.isArray(row.evidence) ? row.evidence : [],
          status: row.status,
          createdAt: row.created_at,
          reviewedAt: row.reviewed_at || undefined,
          reviewNotes: row.review_notes || undefined
        }));
      }

      let userNotifications: UserNotification[] = [];
      if (authUser) {
        const { data: notificationRows, error: notificationsError } = await supabase
          .from('user_notifications')
          .select('id, title, message, related_report_id, match_suggestion_id, created_at, read_at')
          .order('created_at', { ascending: false })
          .limit(50);
        if (notificationsError) throw notificationsError;
        userNotifications = (notificationRows || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          relatedReportId: row.related_report_id || undefined,
          matchSuggestionId: row.match_suggestion_id || undefined,
          createdAt: row.created_at,
          readAt: row.read_at || undefined
        }));
      }

      let logs: AuditLog[] = [];
      if (profile?.role === 'admin') {
        const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(300);
        if (error) throw error;
        logs = (data || []).map((row: any) => {
          const actor = profileById.get(row.actor_id) as StudentUser | undefined;
          return {
          id: row.id,
          timestamp: row.created_at,
          actor: actor?.fullName || 'System',
          actorRole: actor?.role === 'admin' ? 'Administrator' : 'Student',
          action: row.action,
          targetId: row.target_id || '',
          details: row.details
        }; });
      }

      setCurrentUser(profile);
      setUsers(profile?.role === 'admin' ? profileRows as StudentUser[] : []);
      setItems(mappedItems);
      setClaims(mappedClaims);
      setAuditLogs(logs);
      setMatchSuggestions(suggestions);
      setNotifications(userNotifications);
    } catch (error: any) {
      showNotification(error?.message || 'Unable to load CampusFind data.');
    } finally {
      setLoading(false);
    }
  }, [authReady, authUser, showNotification]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const invokeCampusFindAuth = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('campusfind-auth', { body: payload });
    if (error) {
      let message = error.message || 'Authentication request failed.';
      try {
        const response = (error as any).context;
        const details = response?.json ? await response.json() : null;
        if (details?.error) message = details.error;
      } catch {
        // Keep the SDK error if the response body is unavailable.
      }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // Password validation happens on the Edge Function; no browser session is issued yet.
  const signIn = async (email: string, password: string) => {
    await invokeCampusFindAuth({ action: 'password-otp', email: email.trim(), password });
    showNotification('Password accepted. Check your email for the verification code.');
  };

  const verifyEmailOtp = async (email: string, token: string, flow: 'signup' | 'magiclink') => {
    const data = await invokeCampusFindAuth({
      action: 'verify-otp',
      email: email.trim(),
      token: token.trim(),
      flow
    });
    if (!data?.session?.access_token || !data?.session?.refresh_token) {
      throw new Error('Verification succeeded but no secure login session was returned. Please try again.');
    }
    const { error } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
    if (error) throw error;
    showNotification('Email verified. You are now signed in.');
  };

  const signUp = async (details: { email: string; password: string; fullName: string; studentId: string; phone: string; hallOfResidence: string; department: string }) => {
    await invokeCampusFindAuth({
      action: 'signup',
      email: details.email.trim(),
      password: details.password,
      fullName: details.fullName,
      studentId: details.studentId,
      phone: details.phone,
      hallOfResidence: details.hallOfResidence,
      department: details.department
    });
    showNotification('Verification code sent. Check your email to activate your account.');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
    setItems([]);
    setClaims([]);
    setUsers([]);
    setAuditLogs([]);
    setMatchSuggestions([]);
    setNotifications([]);
    showNotification('You have signed out.');
  };

  const addItemReport = async (report: Omit<ItemReport, 'id' | 'dateReported' | 'status' | 'claimsCount'> & { mediaFiles?: File[] }) => {
    if (!authUser || !currentUser) throw new Error('Please sign in before reporting an item.');
    const mediaFiles = (report.mediaFiles || []).slice(0, 2);
    const uploadedPaths: string[] = [];
    let data: any;
    let stage = 'photo upload';

    try {
      for (const file of mediaFiles) {
        const extension = file.name.split('.').pop()?.toLowerCase() || (file.type === 'video/mp4' ? 'mp4' : 'jpg');
        const inferredTypes: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
        const contentType = file.type || inferredTypes[extension] || 'application/octet-stream';
        const path = `${authUser.id}/${crypto.randomUUID()}.${extension}`;
        const storage = supabase.storage.from('item-photos');
        let { error: uploadError } = await storage.upload(path, file, {
          contentType,
          upsert: true
        });
        // A lost browser response can leave the first upload completed on the server.
        // Reusing the same path with upsert makes one network retry safe.
        if (uploadError?.message?.toLowerCase().includes('failed to fetch')) {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          ({ error: uploadError } = await storage.upload(path, file, {
            contentType,
            upsert: true
          }));
        }
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      stage = 'report record save';
      const legacyImagePath = mediaFiles.length === 0
        ? await uploadDataUrl('item-photos', authUser.id, report.imageUrl)
        : null;
      const firstType = mediaFiles[0]?.type.startsWith('video/') ? 'video' : 'image';
      const secondType = mediaFiles[1]?.type.startsWith('video/') ? 'video' : 'image';
      const { data: inserted, error } = await supabase.from('item_reports').insert({
        reporter_id: authUser.id,
        type: report.type,
        title: report.title,
        category: report.category,
        description: report.description,
        campus_location: report.campusLocation,
        date_event: report.dateEvent,
        color: report.color,
        image_path: uploadedPaths[0] || legacyImagePath,
        media_path_2: uploadedPaths[1] || null,
        media_type: firstType,
        media_type_2: uploadedPaths[1] ? secondType : null,
        reward_offered: report.rewardOffered || null
      }).select('*').single();
      if (error) throw error;
      data = inserted;
    } catch (error: any) {
      if (uploadedPaths.length) {
        await supabase.storage.from('item-photos').remove(uploadedPaths);
      }
      const detail = error?.message === 'Failed to fetch'
        ? 'The browser could not complete the network request. Check the connection and retry.'
        : error?.message || 'Unknown service error.';
      throw new Error(`CampusFind ${stage} failed: ${detail}`);
    }
    if (report.distinctMarks || report.specificSpot || report.storageLocation) {
      const { error: privateError } = await supabase.from('report_private_details').insert({
        item_id: data.id,
        owner_id: authUser.id,
        distinct_marks: report.distinctMarks || null,
        specific_spot: report.specificSpot || null,
        storage_location: report.storageLocation || null
      });
      if (privateError) throw new Error(`Private report details could not be saved: ${privateError.message}`);
    }
    await refreshData();
    showNotification(`Your ${report.type} item report has been published.`);
    const result = items.find((item) => item.id === data.id);
    return result || ({
      ...report,
      id: data.id,
      dateReported: data.created_at,
      status: 'open',
      claimsCount: 0
    } as ItemReport);
  };

  const updateItemStatus = async (itemId: string, status: ItemStatus) => {
    const { error } = await supabase.from('item_reports').update({
      status,
      resolution_date: status === 'recovered' ? new Date().toISOString().slice(0, 10) : null
    }).eq('id', itemId);
    if (error) throw error;
    await refreshData();
    showNotification(`Item report status updated to ${status}.`);
  };

  const deleteItemReport = async (itemId: string) => {
    if (!authUser || currentUser?.role !== 'admin') {
      throw new Error('Only an administrator can remove a CampusFind submission.');
    }

    const { data: report, error: reportError } = await supabase
      .from('item_reports')
      .select('id, title, image_path, media_path_2')
      .eq('id', itemId)
      .single();
    if (reportError) throw reportError;

    // Remove all private files through the Storage API before deleting their database records.
    const { data: linkedClaims, error: linkedClaimsError } = await supabase
      .from('claims')
      .select('proof_document_path')
      .eq('item_id', itemId);
    if (linkedClaimsError) throw linkedClaimsError;

    const claimEvidencePaths = (linkedClaims || [])
      .map((claim: any) => claim.proof_document_path)
      .filter((path: string | null): path is string =>
        Boolean(path) && !path!.startsWith('http') && !path!.startsWith('data:') && !path!.startsWith('/')
      );
    if (claimEvidencePaths.length > 0) {
      const { error: evidenceError } = await supabase.storage
        .from('claim-evidence')
        .remove(claimEvidencePaths);
      if (evidenceError) throw new Error(`Linked claim evidence could not be removed: ${evidenceError.message}`);
    }

    const itemMediaPaths = [report.image_path, report.media_path_2]
      .filter((path: string | null): path is string =>
        Boolean(path) && !path!.startsWith('http') && !path!.startsWith('data:') && !path!.startsWith('/')
      );
    if (itemMediaPaths.length > 0) {
      const { error: mediaError } = await supabase.storage
        .from('item-photos')
        .remove(itemMediaPaths);
      if (mediaError) throw new Error(`The submission media could not be removed: ${mediaError.message}`);
    }

    const { error: deleteError } = await supabase
      .from('item_reports')
      .delete()
      .eq('id', itemId);
    if (deleteError) throw deleteError;

    const { error: auditError } = await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      action: 'REPORT_DELETED',
      target_id: itemId,
      details: `Administrator deleted submission "${report.title}" after confirmation.`
    });
    if (auditError) {
      console.error('Submission was removed, but its audit entry could not be saved:', auditError);
    }

    await refreshData();
    showNotification('Submission and its uploaded media have been removed.');
  };

  const deleteClaim = async (claimId: string) => {
    if (!authUser) throw new Error('Please sign in before deleting a claim.');
    const claim = claims.find((entry) => entry.id === claimId && entry.claimantId === authUser.id);
    if (!claim) throw new Error('You can only delete your own claim.');
    if (claim.status !== 'pending') throw new Error('Only claims that are still pending can be withdrawn. Please contact the Security Desk about a claim already reviewed.');

    const { data: row, error: lookupError } = await supabase
      .from('claims')
      .select('id, proof_document_path')
      .eq('id', claimId)
      .eq('claimant_id', authUser.id)
      .eq('status', 'pending')
      .single();
    if (lookupError) throw lookupError;

    const { error: deleteError } = await supabase
      .from('claims')
      .delete()
      .eq('id', claimId)
      .eq('claimant_id', authUser.id)
      .eq('status', 'pending');
    if (deleteError) throw deleteError;

    if (row.proof_document_path) {
      const { error: evidenceError } = await supabase.storage
        .from('claim-evidence')
        .remove([row.proof_document_path]);
      if (evidenceError) console.error('Claim was withdrawn, but its evidence file could not be removed:', evidenceError);
    }

    await refreshData();
    showNotification('Your pending claim has been withdrawn.');
  };

  const submitClaim = async (claimData: { itemId: string; itemTitle: string; itemCategory: any; itemCampusLocation: string; proofDescription: string; proofDocumentFile?: File }) => {
    if (!authUser) throw new Error('Please sign in before submitting a claim.');

    let evidencePath: string | null = null;
    if (claimData.proofDocumentFile) {
      const file = claimData.proofDocumentFile;
      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      evidencePath = `${authUser.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('claim-evidence').upload(evidencePath, file, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw uploadError;
    }

    const { data, error } = await supabase.from('claims').insert({
      item_id: claimData.itemId,
      claimant_id: authUser.id,
      proof_description: claimData.proofDescription,
      proof_document_path: evidencePath
    }).select('*').single();

    if (error) {
      if (evidencePath) await supabase.storage.from('claim-evidence').remove([evidencePath]);
      throw error;
    }

    await refreshData();
    showNotification('Your ownership claim has been submitted for review.');
    return {
      id: data.id,
      itemId: data.item_id,
      itemTitle: claimData.itemTitle,
      itemCategory: claimData.itemCategory,
      itemCampusLocation: claimData.itemCampusLocation,
      claimantName: currentUser?.fullName || '',
      claimantStudentId: currentUser?.studentId || '',
      claimantEmail: authUser.email || '',
      claimantPhone: currentUser?.phone || '',
      claimantHall: currentUser?.hallOfResidence || '',
      proofDescription: data.proof_description,
      proofDocumentUrl: await signedUrl('claim-evidence', evidencePath),
      status: data.status,
      submittedAt: data.submitted_at
    } as Claim;
  };

  const reviewClaim = async (
    claimId: string,
    status: ClaimStatus,
    adminNotes: string,
    collectionLocation?: string,
    recipientIdVerified = false,
    handoverNotes?: string,
    handoverCode?: string,
    handoverEvidenceFile?: File
  ) => {
    if (!authUser || currentUser?.role !== 'admin') throw new Error('Administrator access is required.');
    if (!adminNotes.trim()) throw new Error("Please enter the administrator's decision notes.");
    if (status === 'approved' && !collectionLocation?.trim()) throw new Error('A collection point is required.');
    if (status === 'collected') {
      if (!recipientIdVerified) throw new Error("Verify the recipient's UCC student ID before recording collection.");
      if (!collectionLocation?.trim()) throw new Error('A collection point is required.');
      if (!handoverNotes?.trim()) throw new Error('Please record the physical handover details.');
      if (!handoverCode || !/^\d{8}$/.test(handoverCode.trim())) throw new Error('Enter the claimant’s valid eight-digit collection code.');
      if (handoverEvidenceFile && !['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'].includes(handoverEvidenceFile.type)) throw new Error('Handover proof must be a JPG, PNG, WebP, MP4, WebM or MOV file.');
      if (handoverEvidenceFile && handoverEvidenceFile.size > 20 * 1024 * 1024) throw new Error('Handover proof must be 20MB or smaller.');
    }
    if (status === 'approved') {
      const { error } = await supabase.functions.invoke('campusfind-approve-claim', {
        body: {
          claimId,
          adminNotes: adminNotes.trim(),
          collectionLocation: collectionLocation!.trim()
        }
      });
      if (error) {
        let message = error.message || 'Claim approval and email delivery failed.';
        try {
          const details = (error as any).context?.json ? await (error as any).context.json() : null;
          if (details?.error) message = details.error;
        } catch {
          // Keep the SDK error when no structured response is available.
        }
        throw new Error(message);
      }
      await refreshData();
      showNotification('Claim approved. The student has been emailed their collection code.');
      return;
    }

    const reviewedAt = new Date().toISOString();
    let handoverEvidencePath: string | null = null;
    if (status === 'collected' && handoverEvidenceFile) {
      const extension = handoverEvidenceFile.name.split('.').pop()?.toLowerCase() || 'bin';
      handoverEvidencePath = `${authUser.id}/handovers/${claimId}/${crypto.randomUUID()}.${extension}`;
      const { error: evidenceUploadError } = await supabase.storage.from('claim-evidence').upload(handoverEvidencePath, handoverEvidenceFile, { contentType: handoverEvidenceFile.type, upsert: false });
      if (evidenceUploadError) throw evidenceUploadError;
    }
    const { error: claimError } = await supabase.from('claims').update({
      status,
      admin_notes: adminNotes.trim(),
      collection_location: status === 'collected' ? collectionLocation?.trim() || null : null,
      collection_code: null,
      collection_code_expires_at: null,
      collection_code_issued_at: null,
      handover_code: status === 'collected' ? handoverCode?.trim() : null,
      reviewed_by: authUser.id,
      reviewed_at: reviewedAt,
      collected_at: status === 'collected' ? reviewedAt : null,
      collected_by: status === 'collected' ? authUser.id : null,
      recipient_id_verified: status === 'collected' ? recipientIdVerified : false,
      handover_notes: status === 'collected' ? handoverNotes?.trim() || null : null,
      ...(status === 'collected' && handoverEvidencePath ? { handover_evidence_path: handoverEvidencePath } : {})
    }).eq('id', claimId).select('item_id').single();
    if (claimError) {
      if (handoverEvidencePath) await supabase.storage.from('claim-evidence').remove([handoverEvidencePath]);
      throw claimError;
    }
    // A database trigger updates the item status in the same transaction as the claim decision.
    await refreshData();
    showNotification(`Claim ${status}.`);
  };

  const reviewMatchSuggestion = async (
    suggestionId: string,
    decision: 'approved' | 'rejected',
    notes: string
  ) => {
    if (!authUser || currentUser?.role !== 'admin') throw new Error('Administrator access is required.');
    if (!notes.trim()) throw new Error('Please provide a decision note.');
    const { error } = await supabase
      .from('match_suggestions')
      .update({ status: decision, review_notes: notes.trim() })
      .eq('id', suggestionId)
      .eq('status', 'pending')
      .select('id')
      .single();
    if (error) throw error;
    await refreshData();
    showNotification(`Potential match ${decision}.`);
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!authUser) throw new Error('Please sign in to view notifications.');
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from('user_notifications')
      .update({ read_at: readAt })
      .eq('id', notificationId)
      .eq('user_id', authUser.id)
      .is('read_at', null)
      .select('id')
      .single();
    if (error) throw error;
    setNotifications((current) => current.map((notification) =>
      notification.id === notificationId ? { ...notification, readAt } : notification
    ));
  };

  const markItemRecovered = async (itemId: string) => {
    await updateItemStatus(itemId, 'recovered');
  };

  return (
    <AppContext.Provider value={{
      items, claims, users, currentUser, authUser, auditLogs, matchSuggestions, notifications, loading,
      signIn, verifyEmailOtp, signUp, signOut, refreshData, addItemReport, updateItemStatus,
      deleteItemReport, submitClaim, deleteClaim, reviewClaim, markItemRecovered, reviewMatchSuggestion, markNotificationRead,
      notification, showNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
