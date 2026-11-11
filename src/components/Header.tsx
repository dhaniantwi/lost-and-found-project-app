import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ShieldCheck, FolderKanban, LogIn, LogOut, UserRound } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReportModal: (type?: 'lost' | 'found') => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenReportModal, onOpenAuthModal }) => {
  const { currentUser, signOut, notifications, showNotification } = useApp();

  const handleSignOut = async () => {
    try {
      await signOut();
      setActiveTab('browse');
    } catch (error: any) {
      showNotification(error?.message || 'Unable to sign out.');
    }
  };

  const navClass = (tab: string) => `hover:text-blue-900 transition-colors whitespace-nowrap py-1 border-b-2 ${activeTab === tab ? 'border-blue-900 text-blue-900 font-semibold' : 'border-transparent text-slate-600'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-[0_8px_30px_rgba(15,23,42,.045)] backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 sm:min-h-16 sm:flex-nowrap sm:gap-4 sm:py-0">
          <button onClick={() => setActiveTab('browse')} className="text-left flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 text-[10px] font-black tracking-tight text-amber-300 shadow-lg shadow-blue-950/20 ring-1 ring-white">UCC</div>
            <span className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">CampusFind<span className="text-blue-800">.</span><span className="ml-1 hidden text-[9px] font-bold uppercase tracking-[.18em] text-slate-400 xl:inline">UCC Lost & Found</span></span>
          </button>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            <button onClick={() => setActiveTab('browse')} className={navClass('browse')}>Browse Catalog</button>
            {currentUser && <button onClick={() => setActiveTab('my-activity')} className={navClass('my-activity')}>My Claims & Reports {notifications.some((notification) => !notification.readAt) && <span className="ml-1 rounded-full bg-amber-100 text-amber-900 px-1.5 text-[10px]">{notifications.filter((notification) => !notification.readAt).length}</span>}</button>}
            {currentUser?.role === 'admin' && <button onClick={() => setActiveTab('admin')} className={`${navClass('admin')} inline-flex items-center gap-1.5`}><ShieldCheck className="w-4 h-4" /> Admin Desk</button>}
            <button onClick={() => setActiveTab('project-docs')} className={`${navClass('project-docs')} inline-flex items-center gap-1.5`}><FolderKanban className="w-4 h-4" /> SE Group Hub</button>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 max-w-48">
                  <UserRound className="w-4 h-4 text-blue-900 shrink-0" />
                  <span className="truncate font-semibold">{currentUser.fullName}</span>
                  {currentUser.role === 'admin' && <span className="text-[10px] bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded">Admin</span>}
                </div>
                <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 sm:px-3 sm:text-xs"><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign out</span></button>
              </>
            ) : (
              <button onClick={onOpenAuthModal} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-900/15 bg-white px-2.5 py-2 text-[11px] font-bold text-blue-950 shadow-sm transition hover:border-blue-900/30 hover:bg-blue-50 sm:px-4 sm:py-2.5 sm:text-xs"><LogIn className="w-3.5 h-3.5" />Sign in</button>
            )}
            <button onClick={() => onOpenReportModal()} className="inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 shadow-xs whitespace-nowrap sm:px-3.5 sm:py-2 sm:text-xs"><Plus className="w-3.5 h-3.5" /><span>Report Item</span></button>
          </div>
        </div>

        <div className="lg:hidden -mx-3 flex max-w-[calc(100%+1.5rem)] min-w-0 items-center gap-2 overflow-x-auto overscroll-x-contain px-3 py-2.5 border-t border-slate-100 text-xs sm:-mx-6 sm:max-w-[calc(100%+3rem)] sm:px-6">
          <button onClick={() => setActiveTab('browse')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'browse' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>Catalog</button>
          {currentUser && <button onClick={() => setActiveTab('my-activity')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'my-activity' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>My Items {notifications.some((notification) => !notification.readAt) ? `(${notifications.filter((notification) => !notification.readAt).length})` : ''}</button>}
          {currentUser?.role === 'admin' && <button onClick={() => setActiveTab('admin')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>Admin Desk</button>}
          <button onClick={() => setActiveTab('project-docs')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'project-docs' ? 'bg-blue-900 text-white' : 'text-blue-900'}`}>SE Hub</button>
        </div>
      </div>
    </header>
  );
};
