import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Claim, ItemReport, StudentUser } from '../types';
import { MatchReviewQueue } from './MatchReviewQueue';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Archive,
  Search,
  FileCheck2,
  Users,
  History,
  Building,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectItem: (item: ItemReport) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectItem }) => {
  const {
    items,
    claims,
    users,
    currentUser,
    auditLogs,
    reviewClaim,
    deleteItemReport,
    markItemRecovered,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'claims' | 'reports' | 'users' | 'logs' | 'matches'>('matches');
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<Claim | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected' | 'collected'>('approved');

  const [reviewNotes, setReviewNotes] = useState('');
  const [collectionLocation, setCollectionLocation] = useState('Central Security Post (North Gate)');
  const [recipientIdVerified, setRecipientIdVerified] = useState(false);
  const [reportSearch, setReportSearch] = useState('');

  if (currentUser?.role !== 'admin') return null;

  // Metrics
  const totalItems = items.length;
  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const recoveredCount = items.filter((i) => i.status === 'recovered').length;
  const recoveryRate = totalItems > 0 ? Math.round((recoveredCount / totalItems) * 100) : 0;

  const handleOpenReviewModal = (claim: Claim) => {
    setSelectedClaimForReview(claim);
    setReviewDecision(claim.status === 'approved' ? 'collected' : 'approved');
    setReviewNotes('');
    setCollectionLocation(claim.collectionLocation || 'Central Security Post (North Gate)');
    setRecipientIdVerified(false);
  };

  const handleConfirmReview = async () => {
    if (!selectedClaimForReview) return;
    try {
      if (!reviewNotes.trim()) throw new Error('Please enter the decision or handover notes.');
      if (reviewDecision === 'approved' && !collectionLocation.trim()) throw new Error('Enter a collection point for the student.');
      if (reviewDecision === 'collected' && !recipientIdVerified) throw new Error('Confirm that the claimant’s UCC student ID has been checked.');
      await reviewClaim(
        selectedClaimForReview.id,
        reviewDecision,
        reviewNotes,
        collectionLocation,
        recipientIdVerified,
        reviewDecision === 'collected' ? reviewNotes : undefined
      );
      setSelectedClaimForReview(null);
    } catch (error: any) {
      showNotification(error?.message || 'Unable to update this claim.');
    }
  };

  const filteredReports = items.filter((item) => {
    if (!reportSearch.trim()) return true;
    const query = reportSearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.campusLocation.toLowerCase().includes(query) ||
      item.reporterName.toLowerCase().includes(query) ||
      item.reporterStudentId.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip space-y-4 sm:space-y-6">
      {/* Admin Command Bar */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-amber-300 mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Directorate of University Security · Admin Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white break-words">Central Security Operations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="text-slate-300">Verification, reporting and campus recovery overview</span><span className="mx-1 text-slate-500">·</span> Signed in as <strong className="text-white">{currentUser.fullName}</strong>
          </p>
        </div>


      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="min-w-0 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-slate-500 font-medium">Pending Claims Queue</div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            {pendingClaims.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting identity check</div>
        </div>

        <div className="min-w-0 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-slate-500 font-medium">Total Registered Items</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalItems}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Campus lost & found logs</div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-slate-500 font-medium">Campus Recovery Rate</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {recoveryRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{recoveredCount} items handed back</div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-slate-500 font-medium">Registered Students</div>
          <div className="text-2xl font-bold text-blue-900 font-mono tabular-nums mt-1">
            {users.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active directory records</div>
        </div>
      </div>

      {/* Admin Subtabs */}
      <div className="flex max-w-full min-w-0 items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'matches' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Automated Match Queue</span>
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'bg-blue-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Claims Verification Queue ({claims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-blue-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Report Moderation ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-blue-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-blue-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'matches' && <MatchReviewQueue />}

      {/* Tab 1: Claims Verification Queue */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No claims submitted yet in the system.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Claim ID</th>
                      <th className="py-3 px-4">Target Item</th>
                      <th className="py-3 px-4">Claimant Student</th>
                      <th className="py-3 px-4">Proof Summary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {claim.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                          {claim.itemTitle}
                          <div className="text-[11px] text-slate-400 font-normal">
                            {claim.itemCampusLocation}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{claim.claimantName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {claim.claimantStudentId} · {claim.claimantHall}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm">
                          <p className="line-clamp-2 text-xs">{claim.proofDescription}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {claim.status === 'pending' && (
                            <span className="font-semibold text-amber-700">Pending Review</span>
                          )}
                          {claim.status === 'approved' && (
                            <span className="font-semibold text-emerald-700">Approved</span>
                          )}
                          {claim.status === 'rejected' && (
                            <span className="font-semibold text-rose-700">Rejected</span>
                          )}
                          {claim.status === 'collected' && (
                            <span className="font-semibold text-blue-900">Handed Over</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenReviewModal(claim)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors"
                          >
                            {claim.status === 'pending' ? 'Review Claim' : claim.status === 'approved' ? 'Record Handover' : 'View Record'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Report Moderation */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              placeholder="Filter reports by keyword, reporter student ID, title, or hall..."
              className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Item Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Reporter</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReports.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {item.title}
                        <div className="text-[11px] text-slate-400">{item.category}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold">
                        {item.type === 'lost' ? (
                          <span className="text-rose-700">Lost</span>
                        ) : (
                          <span className="text-emerald-700">Found</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {item.campusLocation}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div>{item.reporterName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{item.reporterStudentId}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap capitalize font-medium">
                        {item.status.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        {item.type === 'lost' && item.status !== 'recovered' && (
                          <button
                            onClick={() => markItemRecovered(item.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded"
                          >
                            Mark Recovered
                          </button>
                        )}
                        <button
                          onClick={() => deleteItemReport(item.id)}
                          className="px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded"
                          title="Remove inappropriate or duplicate report"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Student Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              UCC Campus User Directory
            </h4>
            <span className="text-xs text-slate-500 font-mono tabular-nums">{users.length} enrolled accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Student ID / Staff ID</th>
                  <th className="py-3 px-4">Department / Unit</th>
                  <th className="py-3 px-4">Hall of Residence</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{user.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{user.studentId}</td>
                    <td className="py-3 px-4 text-slate-600">{user.department}</td>
                    <td className="py-3 px-4 text-slate-600">{user.hallOfResidence}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{user.email}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize font-medium text-slate-800">{user.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Immutable Security Audit Trail
            </h4>
            <span className="text-xs text-slate-500 font-mono tabular-nums">{auditLogs.length} events logged</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-900 mt-1.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.details}</p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Actor: <span className="font-medium text-slate-700">{log.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedClaimForReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verify Ownership Claim</h3>
                <p className="text-xs text-slate-500">Claim ID: {selectedClaimForReview.id}</p>
              </div>
              <button
                onClick={() => setSelectedClaimForReview(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-500">Target Item:</div>
                <div className="font-semibold text-slate-900 text-sm">{selectedClaimForReview.itemTitle}</div>
                <div className="text-slate-600 mt-0.5">{selectedClaimForReview.itemCampusLocation}</div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="font-semibold text-amber-900 mb-1">Claimant Submitted Secret Proof:</div>
                <p className="text-slate-700 leading-relaxed">{selectedClaimForReview.proofDescription}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Administrative Action Decision *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedClaimForReview.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => setReviewDecision('approved')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        reviewDecision === 'approved'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      ✓ Approve Claim
                    </button>
                  )}
                  {(selectedClaimForReview.status === 'pending' || selectedClaimForReview.status === 'approved') && (
                    <button
                      type="button"
                      onClick={() => setReviewDecision('rejected')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        reviewDecision === 'rejected'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      ✕ Reject Claim
                    </button>
                  )}
                  {selectedClaimForReview.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => setReviewDecision('collected')}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        reviewDecision === 'collected'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      ★ Record Handover
                    </button>
                  )}
                  {(selectedClaimForReview.status === 'rejected' || selectedClaimForReview.status === 'collected') && (
                    <p className="col-span-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      This claim is closed and can only be viewed. Its status cannot be changed.
                    </p>
                  )}
                </div>
              </div>

              {(reviewDecision === 'approved' || reviewDecision === 'collected') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Designated In-Person Collection Point
                  </label>
                  <input
                    type="text"
                    value={collectionLocation}
                    onChange={(e) => setCollectionLocation(e.target.value)}
                    readOnly={reviewDecision === 'collected'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-800"
                  />
                </div>
              )}

              {reviewDecision === 'collected' && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-200 bg-blue-50 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={recipientIdVerified}
                    onChange={(e) => setRecipientIdVerified(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I confirm that I physically checked the claimant’s original UCC student ID and verified that the person collecting the item is the approved claimant.
                  </span>
                </label>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {reviewDecision === 'collected' ? 'Physical Handover Notes *' : 'Officer Notes & Instructions to Student *'}
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewDecision === 'collected' ? 'Record the date/time, item condition, and any handover details...' : 'Provide verification notes or collection instructions...'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedClaimForReview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              {selectedClaimForReview.status === 'pending' || selectedClaimForReview.status === 'approved' ? (
                <button
                  onClick={handleConfirmReview}
                  disabled={!reviewNotes.trim() || (reviewDecision === 'collected' && !recipientIdVerified)}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs"
                >
                  {reviewDecision === 'collected' ? 'Confirm Physical Handover' : 'Execute Decision'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
