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
  signUp: (details: { email: string; password: string; fullName: string; studentId: string; phone: string; hallOfResidence: string; department: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  addItemReport: (report: Omit<ItemReport, 'id' | 'dateReported' | 'status' | 'claimsCount'>) => Promise<ItemReport>;
  updateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>;
  deleteItemReport: (itemId: string) => Promise<void>;
  submitClaim: (claimData: { itemId: string; itemTitle: string; itemCategory: any; itemCampusLocation: string; proofDescription: string; proofDocumentUrl?: string }) => Promise<Claim>;
  reviewClaim: (
    claimId: string,
    status: ClaimStatus,
    adminNotes: string,
    collectionLocation?: string,
    recipientIdVerified?: boolean,
    handoverNotes?: string
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
            .select('id, reporter_id, type, title, category, description, campus_location, date_event, color, image_path, status, reward_offered, claims_count, resolution_date, created_at')
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
          imageUrl: authUser && (ownRecord || profile?.role === 'admin')
            ? await signedUrl('item-photos', row.image_path)
            : undefined,
          reporterName: owner?.fullName || (ownRecord ? profile?.fullName : 'UCC student'),
          reporterStudentId: owner?.studentId || (ownRecord ? profile?.studentId : ''),
          reporterEmail: owner?.email || (ownRecord ? authUser?.email || '' : ''),
          reporterPhone: owner?.phone || (ownRecord ? profile?.phone : ''),
          reporterHall: owner?.hallOfResidence || (ownRecord ? profile?.hallOfResidence : ''),
          status: row.status,
          claimsCount: row.claims_count || 0,
          rewardOffered: row.reward_offered || undefined,
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
            collectedAt: row.collected_at || undefined,
            collectedBy: row.collected_by || undefined,
            recipientIdVerified: row.recipient_id_verified || false,
            handoverNotes: row.handover_notes || undefined
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    showNotification('Signed in successfully.');
  };

  const signUp = async (details: { email: string; password: string; fullName: string; studentId: string; phone: string; hallOfResidence: string; department: string }) => {
    const { error } = await supabase.auth.signUp({
      email: details.email.trim(),
      password: details.password,
      options: {
        emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
        data: {
          full_name: details.fullName.trim(),
          student_id: details.studentId.trim(),
          phone: details.phone.trim(),
          hall_of_residence: details.hallOfResidence,
          department: details.department.trim()
        }
      }
    });
    if (error) throw error;
    showNotification('Account request submitted. Check your email if confirmation is required.');
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

  const addItemReport = async (report: Omit<ItemReport, 'id' | 'dateReported' | 'status' | 'claimsCount'>) => {
    if (!authUser || !currentUser) throw new Error('Please sign in before reporting an item.');
    const imagePath = await uploadDataUrl('item-photos', authUser.id, report.imageUrl);
    const { data, error } = await supabase.from('item_reports').insert({
      reporter_id: authUser.id,
      type: report.type,
      title: report.title,
      category: report.category,
      description: report.description,
      campus_location: report.campusLocation,
      date_event: report.dateEvent,
      color: report.color,
      image_path: imagePath,
      reward_offered: report.rewardOffered || null
    }).select('*').single();
    if (error) throw error;
    if (report.distinctMarks || report.specificSpot || report.storageLocation) {
      const { error: privateError } = await supabase.from('report_private_details').insert({
        item_id: data.id,
        owner_id: authUser.id,
        distinct_marks: report.distinctMarks || null,
        specific_spot: report.specificSpot || null,
        storage_location: report.storageLocation || null
      });
      if (privateError) throw privateError;
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
    const { error } = await supabase.from('item_reports').delete().eq('id', itemId);
    if (error) throw error;
    await refreshData();
    showNotification('Report deleted.');
  };

  const submitClaim = async (claimData: { itemId: string; itemTitle: string; itemCategory: any; itemCampusLocation: string; proofDescription: string; proofDocumentUrl?: string }) => {
    if (!authUser) throw new Error('Please sign in before submitting a claim.');
    const evidencePath = await uploadDataUrl('claim-evidence', authUser.id, claimData.proofDocumentUrl);
    const { data, error } = await supabase.from('claims').insert({
      item_id: claimData.itemId,
      claimant_id: authUser.id,
      proof_description: claimData.proofDescription,
      proof_document_path: evidencePath
    }).select('*').single();
    if (error) throw error;
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
      proofDocumentUrl: undefined,
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
    handoverNotes?: string
  ) => {
    if (!authUser || currentUser?.role !== 'admin') throw new Error('Administrator access is required.');
    if (!adminNotes.trim()) throw new Error("Please enter the administrator's decision notes.");
    if (status === 'collected') {
      if (!recipientIdVerified) throw new Error("Verify the recipient's UCC student ID before recording collection.");
      if (!collectionLocation?.trim()) throw new Error('A collection point is required.');
      if (!handoverNotes?.trim()) throw new Error('Please record the physical handover details.');
    }
    const reviewedAt = new Date().toISOString();
    const { data: claim, error: claimError } = await supabase.from('claims').update({
      status,
      admin_notes: adminNotes.trim(),
      collection_location: status === 'approved' || status === 'collected' ? collectionLocation?.trim() || null : null,
      reviewed_by: authUser.id,
      reviewed_at: reviewedAt,
      collected_at: status === 'collected' ? reviewedAt : null,
      collected_by: status === 'collected' ? authUser.id : null,
      recipient_id_verified: status === 'collected' ? recipientIdVerified : false,
      handover_notes: status === 'collected' ? handoverNotes?.trim() || null : null
    }).eq('id', claimId).select('item_id').single();
    if (claimError) throw claimError;
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
      signIn, signUp, signOut, refreshData, addItemReport, updateItemStatus,
      deleteItemReport, submitClaim, reviewClaim, markItemRecovered, reviewMatchSuggestion, markNotificationRead,
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
