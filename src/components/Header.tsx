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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 min-h-16">
          <button onClick={() => setActiveTab('browse')} className="text-left flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-sm">UCC</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CampusFind</span>
          </button>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            <button onClick={() => setActiveTab('browse')} className={navClass('browse')}>Browse Catalog</button>
            {currentUser && <button onClick={() => setActiveTab('my-activity')} className={navClass('my-activity')}>My Claims & Reports {notifications.some((notification) => !notification.readAt) && <span className="ml-1 rounded-full bg-amber-100 text-amber-900 px-1.5 text-[10px]">{notifications.filter((notification) => !notification.readAt).length}</span>}</button>}
            {currentUser?.role === 'admin' && <button onClick={() => setActiveTab('admin')} className={`${navClass('admin')} inline-flex items-center gap-1.5`}><ShieldCheck className="w-4 h-4" /> Admin Desk</button>}
            <button onClick={() => setActiveTab('project-docs')} className={`${navClass('project-docs')} inline-flex items-center gap-1.5`}><FolderKanban className="w-4 h-4" /> SE Group Hub</button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 max-w-48">
                  <UserRound className="w-4 h-4 text-blue-900 shrink-0" />
                  <span className="truncate font-semibold">{currentUser.fullName}</span>
                  {currentUser.role === 'admin' && <span className="text-[10px] bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded">Admin</span>}
                </div>
                <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign out</span></button>
              </>
            ) : (
              <button onClick={onOpenAuthModal} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-900 border border-blue-900/20 rounded-lg hover:bg-blue-50"><LogIn className="w-3.5 h-3.5" />Sign in</button>
            )}
            <button onClick={() => onOpenReportModal()} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 shadow-xs whitespace-nowrap"><Plus className="w-3.5 h-3.5" /><span>Report Item</span></button>
          </div>
        </div>

        <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2.5 border-t border-slate-100 text-xs">
          <button onClick={() => setActiveTab('browse')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'browse' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>Catalog</button>
          {currentUser && <button onClick={() => setActiveTab('my-activity')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'my-activity' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>My Items {notifications.some((notification) => !notification.readAt) ? `(${notifications.filter((notification) => !notification.readAt).length})` : ''}</button>}
          {currentUser?.role === 'admin' && <button onClick={() => setActiveTab('admin')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}>Admin Desk</button>}
          <button onClick={() => setActiveTab('project-docs')} className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'project-docs' ? 'bg-blue-900 text-white' : 'text-blue-900'}`}>SE Hub</button>
        </div>
      </div>
    </header>
  );
};
