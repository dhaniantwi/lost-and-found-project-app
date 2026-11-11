import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ItemReport, Claim } from '../types';
import {
  User,
  Package,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Building,
  PlusCircle,
  ExternalLink,
  Bell
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectItem: (item: ItemReport) => void;
  onOpenReportModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectItem,
  onOpenReportModal
}) => {
  const { currentUser, items, claims, notifications, markItemRecovered, markNotificationRead, showNotification } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'claims' | 'notifications'>('reports');

  if (!currentUser) return null;

  // Filter items reported by current student
  const myReports = items.filter((i) => i.reporterStudentId === currentUser.studentId);

  // Filter claims filed by current student
  const myClaims = claims.filter((c) => c.claimantStudentId === currentUser.studentId);
  const pendingReports = myReports.filter((item) => item.status !== 'recovered').length;
  const recoveredReports = myReports.filter((item) => item.status === 'recovered').length;
  const pendingClaims = myClaims.filter((claim) => claim.status === 'pending').length;
  const unreadNotifications = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 sm:space-y-6">
      {/* Student dashboard welcome panel */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-200"><User className="h-3.5 w-3.5" /> Student workspace</div>
            <p className="text-xs font-medium text-blue-200">Your CampusFind overview</p>
            <h2 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">Welcome back, {currentUser.fullName.split(' ')[0]}.</h2>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">Keep track of your reports, follow claim decisions and stay updated on your campus belongings.</p>
          </div>
          <button onClick={onOpenReportModal} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-black/20 transition hover:bg-amber-300"><PlusCircle className="h-4 w-4" /> Submit a report</button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: 'My reports', value: myReports.length, note: `${pendingReports} still active`, icon: <Package className="h-4 w-4" /> },
            { label: 'Recovered', value: recoveredReports, note: 'Items marked recovered', icon: <CheckCircle2 className="h-4 w-4" /> },
            { label: 'My claims', value: myClaims.length, note: `${pendingClaims} awaiting review`, icon: <FileCheck2 className="h-4 w-4" /> },
            { label: 'Unread updates', value: unreadNotifications, note: 'Notifications to check', icon: <Bell className="h-4 w-4" /> }
          ].map((metric) => (
            <div key={metric.label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[.08] p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-blue-200">{metric.icon}<span>{metric.label}</span></div>
              <div className="mt-2 text-2xl font-black tabular-nums sm:text-3xl">{metric.value}</div>
              <p className="mt-1 text-[10px] leading-snug text-slate-300">{metric.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Student Profile Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-950 to-indigo-700 text-lg font-black text-amber-300 shadow-lg shadow-blue-950/20">
            {currentUser.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h2>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {currentUser.studentId}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
              <span>{currentUser.department}</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.hallOfResidence}</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Report</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex max-w-full min-w-0 items-center gap-2 overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-sm text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'reports'
              ? 'bg-blue-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Reports ({myReports.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('claims')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'claims'
              ? 'bg-blue-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>My Claims ({myClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'notifications'
              ? 'bg-blue-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications ({notifications.filter((notification) => !notification.readAt).length})</span>
        </button>
      </div>

      {/* Tab 1: My Reports */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {myReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">You haven't submitted any reports yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Did you misplace something or discover an abandoned belonging on campus?
              </p>
              <button
                onClick={onOpenReportModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
              >
                Create Report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span
                        className={`font-semibold uppercase tracking-wider text-[11px] ${
                          item.type === 'lost' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {item.type.toUpperCase()} REPORT
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{item.dateEvent}</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-500 font-medium">
                      Status: <strong className="text-slate-800">{item.status.replace('_', ' ')}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {item.type === 'lost' && item.status !== 'recovered' && (
                        <button
                          onClick={() => markItemRecovered(item.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          Mark Recovered
                        </button>
                      )}
                      <button
                        onClick={() => onSelectItem(item)}
                        className="text-xs font-semibold text-blue-900 hover:underline"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Claims */}
      {activeSubTab === 'claims' && (
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No active ownership claims</p>
              <p className="text-xs text-slate-500 mt-1">
                When you find an item in the catalog that belongs to you, submit a claim to start verification.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-xs text-slate-500">Claim for Found Item:</div>
                      <h4 className="text-base font-semibold text-slate-900">{claim.itemTitle}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {claim.itemCampusLocation} · Logged: {new Date(claim.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      {claim.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Under Review by Security</span>
                        </span>
                      )}
                      {claim.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Claim Approved! Ready for Collection</span>
                        </span>
                      )}
                      {claim.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/60">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Claim Declined</span>
                        </span>
                      )}
                      {claim.status === 'collected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Handed Over / Closed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-800">Your Submitted Proof:</span>
                    <p className="mt-1 leading-relaxed text-slate-600">{claim.proofDescription}</p>
                  </div>

                  {claim.adminNotes && (
                    <div className="text-xs p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-900">
                      <span className="font-semibold">Administrator Decision & Instructions:</span>
                      <p className="mt-0.5">{claim.adminNotes}</p>
                      {claim.collectionLocation && (
                        <div className="mt-2 font-medium flex items-center gap-1 text-slate-800">
                          <Building className="w-3.5 h-3.5 text-blue-900" />
                          <span>Collection Point: {claim.collectionLocation}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">You're all caught up</p>
              <p className="text-xs text-slate-500 mt-1">CampusFind updates and administrator decisions about your reports will appear here.</p>
            </div>
          ) : notifications.map((notification) => {
            const relatedItem = notification.relatedReportId
              ? items.find((item) => item.id === notification.relatedReportId)
              : undefined;
            return (
              <article key={notification.id} className={`rounded-xl border p-4 bg-white ${notification.readAt ? 'border-slate-200' : 'border-blue-200 shadow-xs'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{notification.title}</h4>
                      {!notification.readAt && <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">NEW</span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notification.message}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  {relatedItem && (
                    <button
                      onClick={async () => {
                        try {
                          if (!notification.readAt) await markNotificationRead(notification.id);
                          onSelectItem(relatedItem);
                        } catch (error: any) {
                          showNotification(error?.message || 'Unable to open this notification.');
                        }
                      }}
                      className="shrink-0 px-3 py-2 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800"
                    >
                      View report
                    </button>
                  )}
                </div>
                {!relatedItem && !notification.readAt && (
                  <button
                    onClick={async () => {
                      try { await markNotificationRead(notification.id); }
                      catch (error: any) { showNotification(error?.message || 'Unable to mark notification as read.'); }
                    }}
                    className="mt-3 text-xs font-semibold text-blue-900 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
