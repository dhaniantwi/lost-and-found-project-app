import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ShieldCheck, UserCheck, Sparkles, FolderKanban } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReportModal: (type?: 'lost' | 'found') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal
}) => {
  const { currentUser, users, switchUser, matches } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('browse')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs">
                UCC
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors whitespace-nowrap">
                CampusFind
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 single-line clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('browse')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'browse'
                  ? 'border-blue-900 text-blue-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              Browse Catalog
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'matches'
                  ? 'border-blue-900 text-blue-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              <span>Potential Matches</span>
              {matches.length > 0 && (
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                  {matches.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('my-activity')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'my-activity'
                  ? 'border-blue-900 text-blue-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              My Claims & Reports
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-blue-900 text-blue-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Admin Desk</span>
            </button>
            <button
              onClick={() => setActiveTab('project-docs')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'project-docs'
                  ? 'border-blue-900 text-blue-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-blue-600" />
              <span>SE Group Hub</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action + Persona Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Persona Switcher for presentation & review */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 px-2 font-medium">Role:</span>
              <select
                aria-label="Active Persona Role"
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-900 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'admin' ? '🛡️ Admin: ' : '🎓 Student: '}
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onOpenReportModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Item</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2.5 border-t border-slate-100 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'browse' ? 'bg-blue-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'matches' ? 'bg-blue-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('my-activity')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'my-activity' ? 'bg-blue-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            My Items
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'admin' ? 'bg-blue-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Admin Desk
          </button>
          <button
            onClick={() => setActiveTab('project-docs')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'project-docs' ? 'bg-blue-900 text-white' : 'text-blue-900'
            }`}
          >
            SE Hub
          </button>
        </div>
      </div>
    </header>
  );
};
