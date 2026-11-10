import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ItemReport, Claim, StudentUser, AuditLog, ItemStatus, ClaimStatus, MatchScoreResult } from '../types';
import { INITIAL_ITEMS, INITIAL_CLAIMS, INITIAL_USERS, INITIAL_AUDIT_LOGS } from '../data/seedData';
import { findAllMatches } from '../utils/matching';

interface AppContextType {
  items: ItemReport[];
  claims: Claim[];
  users: StudentUser[];
  currentUser: StudentUser;
  auditLogs: AuditLog[];
  matches: MatchScoreResult[];
  switchUser: (userId: string) => void;
  addItemReport: (report: Omit<ItemReport, 'id' | 'dateReported' | 'status' | 'claimsCount'>) => ItemReport;
  updateItemStatus: (itemId: string, status: ItemStatus) => void;
  deleteItemReport: (itemId: string) => void;
  submitClaim: (claimData: {
    itemId: string;
    itemTitle: string;
    itemCategory: any;
    itemCampusLocation: string;
    proofDescription: string;
    proofDocumentUrl?: string;
  }) => Claim;
  reviewClaim: (
    claimId: string,
    status: ClaimStatus,
    adminNotes: string,
    collectionLocation?: string
  ) => void;
  markItemRecovered: (itemId: string) => void;
  resetToDemoData: () => void;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ITEMS: 'campusfind_items_v1',
  CLAIMS: 'campusfind_claims_v1',
  USERS: 'campusfind_users_v1',
  CURRENT_USER_ID: 'campusfind_current_user_id_v1',
  LOGS: 'campusfind_logs_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ItemReport[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return stored ? JSON.parse(stored) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [claims, setClaims] = useState<Claim[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLAIMS);
      return stored ? JSON.parse(stored) : INITIAL_CLAIMS;
    } catch {
      return INITIAL_CLAIMS;
    }
  });

  const [users] = useState<StudentUser[]>(INITIAL_USERS);

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-1';
    } catch {
      return 'user-1';
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [claims]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [auditLogs]);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  const matches = useMemo(() => {
    return findAllMatches(items);
  }, [items]);

  const addAuditLog = (action: string, targetId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.fullName} (${currentUser.role === 'admin' ? 'Admin' : 'Student'})`,
      actorRole: currentUser.role === 'admin' ? 'Administrator' : 'Student',
      action,
      targetId,
      details
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      showNotification(`Switched persona to ${target.fullName} (${target.role.toUpperCase()})`);
    }
  };

  const addItemReport = (
    reportData: Omit<ItemReport, 'id' | 'dateReported' | 'status' | 'claimsCount'>
  ): ItemReport => {
    const newId = `item-${Date.now()}`;
    const newItem: ItemReport = {
      ...reportData,
      id: newId,
      dateReported: new Date().toISOString(),
      status: 'open',
      claimsCount: 0
    };

    setItems((prev) => [newItem, ...prev]);
    addAuditLog(
      newItem.type === 'lost' ? 'REPORTED_LOST' : 'REPORTED_FOUND',
      newId,
      `Reported ${newItem.type}: "${newItem.title}" at ${newItem.campusLocation}`
    );
    showNotification(`New ${newItem.type.toUpperCase()} report successfully published to campus board!`);
    return newItem;
  };

  const updateItemStatus = (itemId: string, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
    addAuditLog('UPDATED_STATUS', itemId, `Changed status of item ${itemId} to ${status}`);
    showNotification(`Item report status updated to ${status}.`);
  };

  const deleteItemReport = (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    addAuditLog('DELETED_REPORT', itemId, `Removed report for: "${target?.title || itemId}"`);
    showNotification(`Report has been deleted from the system.`);
  };

  const submitClaim = ({
    itemId,
    itemTitle,
    itemCategory,
    itemCampusLocation,
    proofDescription,
    proofDocumentUrl
  }: {
    itemId: string;
    itemTitle: string;
    itemCategory: any;
    itemCampusLocation: string;
    proofDescription: string;
    proofDocumentUrl?: string;
  }): Claim => {
    const newClaimId = `claim-${Date.now()}`;
    const newClaim: Claim = {
      id: newClaimId,
      itemId,
      itemTitle,
      itemCategory,
      itemCampusLocation,
      claimantName: currentUser.fullName,
      claimantStudentId: currentUser.studentId,
      claimantEmail: currentUser.email,
      claimantPhone: currentUser.phone,
      claimantHall: currentUser.hallOfResidence,
      proofDescription,
      proofDocumentUrl,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setClaims((prev) => [newClaim, ...prev]);

    // Update item status to 'in_review' and increment claimsCount
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: 'in_review', claimsCount: (i.claimsCount || 0) + 1 }
          : i
      )
    );

    addAuditLog(
      'SUBMITTED_CLAIM',
      newClaimId,
      `Student ${currentUser.fullName} (${currentUser.studentId}) claimed item "${itemTitle}".`
    );

    showNotification(`Claim submitted! Campus administration will review your ownership details.`);
    return newClaim;
  };

  const reviewClaim = (
    claimId: string,
    status: ClaimStatus,
    adminNotes: string,
    collectionLocation?: string
  ) => {
    const now = new Date().toISOString();
    let claimedItemId = '';

    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) {
          claimedItemId = c.itemId;
          return {
            ...c,
            status,
            adminNotes,
            reviewedAt: now,
            reviewedBy: currentUser.fullName,
            collectionLocation: collectionLocation || c.collectionLocation
          };
        }
        return c;
      })
    );

    if (status === 'approved') {
      setItems((prev) =>
        prev.map((item) =>
          item.id === claimedItemId
            ? { ...item, status: 'claimed' }
            : item
        )
      );
    } else if (status === 'collected') {
      setItems((prev) =>
        prev.map((item) =>
          item.id === claimedItemId
            ? { ...item, status: 'recovered', resolutionDate: now.split('T')[0] }
            : item
        )
      );
    }

    addAuditLog(
      `CLAIM_${status.toUpperCase()}`,
      claimId,
      `Administrator ${currentUser.fullName} marked claim ${claimId} as ${status}.`
    );

    showNotification(`Claim ${status.toUpperCase()}: Decision recorded and claimant notified.`);
  };

  const markItemRecovered = (itemId: string) => {
    const now = new Date().toISOString().split('T')[0];
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: 'recovered', resolutionDate: now } : item
      )
    );
    addAuditLog('ITEM_RECOVERED', itemId, `Marked item ${itemId} as safely recovered.`);
    showNotification('Item marked as successfully recovered! Great news for campus community.');
  };

  const resetToDemoData = () => {
    setItems(INITIAL_ITEMS);
    setClaims(INITIAL_CLAIMS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentUserId('user-1');
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.CLAIMS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    showNotification('Reset application data to initial UCC project state.');
  };

  return (
    <AppContext.Provider
      value={{
        items,
        claims,
        users,
        currentUser,
        auditLogs,
        matches,
        switchUser,
        addItemReport,
        updateItemStatus,
        deleteItemReport,
        submitClaim,
        reviewClaim,
        markItemRecovered,
        resetToDemoData,
        notification,
        showNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
