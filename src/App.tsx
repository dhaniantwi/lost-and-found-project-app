import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ItemList } from './components/ItemList';
import { MatchesView } from './components/MatchesView';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectDocumentation } from './components/ProjectDocumentation';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ReportModal } from './components/ReportModal';
import { ClaimModal } from './components/ClaimModal';
import { AuthModal } from './components/AuthModal';
import { ItemReport, ItemType } from './types';
import { CheckCircle2, Shield, HeartHandshake, MapPin, LockKeyhole } from 'lucide-react';

function CampusFindApp() {
  const { items, notification, currentUser, loading } = useApp();
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [selectedItem, setSelectedItem] = useState<ItemReport | null>(null);
  const [claimingItem, setClaimingItem] = useState<ItemReport | null>(null);
  const [pendingClaimItem, setPendingClaimItem] = useState<ItemReport | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalInitialType, setReportModalInitialType] = useState<ItemType>('lost');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleOpenReportModal = (type: ItemType = 'lost') => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setReportModalInitialType(type);
    setReportModalOpen(true);
  };

  const handleSelectItem = (item: ItemReport) => setSelectedItem(item);

  const handleClaimItem = (item: ItemReport) => {
    if (!currentUser) {
      setPendingClaimItem(item);
      setAuthModalOpen(true);
      return;
    }
    setClaimingItem(item);
  };

  useEffect(() => {
    if (currentUser && pendingClaimItem) {
      setClaimingItem(pendingClaimItem);
      setPendingClaimItem(null);
      setAuthModalOpen(false);
    }
  }, [currentUser, pendingClaimItem]);

  const protectedNotice = (heading: string) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto">
      <LockKeyhole className="w-9 h-9 text-blue-900 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-slate-900">{heading}</h2>
      <p className="text-sm text-slate-500 mt-2 mb-5">Sign in with your CampusFind account to access this area.</p>
      <button onClick={() => setAuthModalOpen(true)} className="px-5 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800">Sign in / Create account</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {notification && (
        <div role="status" className="fixed bottom-5 right-5 z-[70] max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-snug">{notification}</span>
        </div>
      )}

      <Header activeTab={activeTab} setActiveTab={setActiveTab} onOpenReportModal={handleOpenReportModal} onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading && items.length === 0 && <div className="text-center py-8 text-xs text-slate-500">Connecting securely to CampusFind…</div>}

        {activeTab === 'browse' && (
          <div>
            <HeroBanner onOpenReportModal={handleOpenReportModal} onNavigateToMatches={() => setActiveTab('matches')} onSearchFocus={() => {}} />
            <ItemList items={items} onSelectItem={handleSelectItem} onClaimItem={handleClaimItem} onOpenReportModal={() => handleOpenReportModal('lost')} />
          </div>
        )}

        {activeTab === 'matches' && (currentUser?.role === 'admin' ? <MatchesView onSelectItem={handleSelectItem} onClaimItem={handleClaimItem} /> : protectedNotice('Administrator access required for match review'))}

        {activeTab === 'my-activity' && (currentUser ? <StudentDashboard onSelectItem={handleSelectItem} onOpenReportModal={() => handleOpenReportModal('lost')} /> : protectedNotice('Your reports and claims'))}

        {activeTab === 'admin' && (currentUser?.role === 'admin' ? <AdminDashboard onSelectItem={handleSelectItem} /> : protectedNotice('Administrator access required'))}

        {activeTab === 'project-docs' && <ProjectDocumentation />}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-900 text-amber-400 font-bold flex items-center justify-center text-[10px]">UCC</div>
            <span className="font-semibold text-slate-700">CampusFind System</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>University of Cape Coast, Ghana</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>Software Engineering Course Project</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Directorate of University Security</span>
            <button onClick={() => setActiveTab('project-docs')} className="text-blue-900 font-medium hover:underline">SE Project Hub & SRS</button>
          </div>
        </div>
      </footer>

      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onOpenClaim={handleClaimItem} onSelectRelated={setSelectedItem} />
      <ReportModal isOpen={reportModalOpen} initialType={reportModalInitialType} onClose={() => setReportModalOpen(false)} />
      <ClaimModal isOpen={claimingItem !== null} item={claimingItem} onClose={() => setClaimingItem(null)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={(authenticated) => {
          setAuthModalOpen(false);
          if (!authenticated) setPendingClaimItem(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return <AppProvider><CampusFindApp /></AppProvider>;
}
