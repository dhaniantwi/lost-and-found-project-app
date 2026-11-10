import React, { useState } from 'react';
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
import { ItemReport, ItemType } from './types';
import { CheckCircle2, Shield, HeartHandshake, MapPin } from 'lucide-react';

function CampusFindApp() {
  const { items, notification } = useApp();

  const [activeTab, setActiveTab] = useState<string>('browse');
  const [selectedItem, setSelectedItem] = useState<ItemReport | null>(null);
  const [claimingItem, setClaimingItem] = useState<ItemReport | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalInitialType, setReportModalInitialType] = useState<ItemType>('lost');

  const handleOpenReportModal = (type: ItemType = 'lost') => {
    setReportModalInitialType(type);
    setReportModalOpen(true);
  };

  const handleSelectItem = (item: ItemReport) => {
    setSelectedItem(item);
  };

  const handleClaimItem = (item: ItemReport) => {
    setClaimingItem(item);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-snug">{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={handleOpenReportModal}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'browse' && (
          <div>
            <HeroBanner
              onOpenReportModal={handleOpenReportModal}
              onNavigateToMatches={() => setActiveTab('matches')}
              onSearchFocus={() => {}}
            />
            <ItemList
              items={items}
              onSelectItem={handleSelectItem}
              onClaimItem={handleClaimItem}
              onOpenReportModal={() => handleOpenReportModal('lost')}
            />
          </div>
        )}

        {activeTab === 'matches' && (
          <MatchesView
            onSelectItem={handleSelectItem}
            onClaimItem={handleClaimItem}
          />
        )}

        {activeTab === 'my-activity' && (
          <StudentDashboard
            onSelectItem={handleSelectItem}
            onOpenReportModal={() => handleOpenReportModal('lost')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onSelectItem={handleSelectItem}
          />
        )}

        {activeTab === 'project-docs' && (
          <ProjectDocumentation />
        )}
      </main>

      {/* Footer (Quiet anti-slop institutional footer) */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-900 text-amber-400 font-bold flex items-center justify-center text-[10px]">
              UCC
            </div>
            <span className="font-semibold text-slate-700">CampusFind System</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>University of Cape Coast, Ghana</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>Software Engineering Course Project</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Directorate of University Security</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={() => setActiveTab('project-docs')}
              className="text-blue-900 font-medium hover:underline"
            >
              SE Project Hub & SRS
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onOpenClaim={handleClaimItem}
        onSelectRelated={(other) => setSelectedItem(other)}
      />

      <ReportModal
        isOpen={reportModalOpen}
        initialType={reportModalInitialType}
        onClose={() => setReportModalOpen(false)}
      />

      <ClaimModal
        isOpen={claimingItem !== null}
        item={claimingItem}
        onClose={() => setClaimingItem(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <CampusFindApp />
    </AppProvider>
  );
}
