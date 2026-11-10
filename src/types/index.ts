export type ItemType = 'lost' | 'found';

export type ItemStatus = 'open' | 'claimed' | 'in_review' | 'recovered' | 'archived';

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'collected';

export type ItemCategory =
  | 'Student ID & Cards'
  | 'Electronics & Phones'
  | 'Calculators & Academic'
  | 'Keys & Lanyards'
  | 'Wallets & Bags'
  | 'Books & Documents'
  | 'Clothing & Accessories'
  | 'Other';

export interface ItemReport {
  id: string;
  type: ItemType;
  title: string;
  category: ItemCategory;
  description: string;
  campusLocation: string; // e.g. Sam Jonah Library, Casely Hayford Hall, New Science Block
  specificSpot?: string;  // e.g. Level 2 Study Carrel, SLT 1 front row
  dateEvent: string;      // YYYY-MM-DD
  dateReported: string;   // ISO timestamp
  color: string;
  distinctMarks?: string; // Private or distinctive notes
  storageLocation?: string; // For found items: e.g. Central Security Post, Porters Lodge
  imageUrl?: string;
  reporterName: string;
  reporterStudentId: string;
  reporterEmail: string;
  reporterPhone: string;
  reporterHall: string;
  status: ItemStatus;
  claimsCount?: number;
  rewardOffered?: string;
  matchedItemId?: string;
  resolutionDate?: string;
}

export interface Claim {
  id: string;
  itemId: string;
  itemTitle: string;
  itemCategory: ItemCategory;
  itemCampusLocation: string;
  claimantName: string;
  claimantStudentId: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantHall: string;
  proofDescription: string; // Specific verifiable details known only to true owner
  proofDocumentUrl?: string; // Image/receipt/ID attachment
  status: ClaimStatus;
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  collectionLocation?: string;
  collectedAt?: string;
  collectedBy?: string;
  recipientIdVerified?: boolean;
  handoverNotes?: string;
}

export interface StudentUser {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  hallOfResidence: string;
  department: string;
  role: 'student' | 'admin';
  joinedDate: string;
}

export interface MatchScoreResult {
  lostItem: ItemReport;
  foundItem: ItemReport;
  score: number; // 0 - 100
  reasons: string[];
}

export interface MatchSuggestion {
  id: string;
  lostReportId: string;
  foundReportId: string;
  score: number;
  evidence: string[];
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  targetId: string;
  details: string;
}
