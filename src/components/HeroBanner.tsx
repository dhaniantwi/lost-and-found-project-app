import React from 'react';
import heroCampusImage from '../assets/images/ucc_campus_hero_1794334426172.jpg';
import { useApp } from '../context/AppContext';
import { Search, PlusCircle, CheckCircle2, Shield, MapPin, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  onOpenReportModal: (type?: 'lost' | 'found') => void;
  onNavigateToMatches: () => void;
  onSearchFocus: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenReportModal,
  onNavigateToMatches,
  onSearchFocus
}) => {
  const { items, matches } = useApp();

  const totalReports = items.length;
  const lostCount = items.filter((i) => i.type === 'lost' && i.status !== 'recovered').length;
  const foundCount = items.filter((i) => i.type === 'found' && i.status !== 'recovered').length;
  const recoveredCount = items.filter((i) => i.status === 'recovered').length;

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl mb-8 border border-slate-800 shadow-md">
      {/* Background Campus Image with measured contrast scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroCampusImage}
          alt="University of Cape Coast Campus"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-25 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/80" />
      </div>

      <div className="relative z-10 p-6 sm:p-10 lg:p-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-3 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>University of Cape Coast · Directorate of University Security</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 text-balance">
            Recover What You Lost. Reconnect What You Found.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed max-w-2xl">
            A centralized lost and found management platform for UCC students, halls of residence,
            and lecture complexes. Submit reports with photo verification and track ownership claims.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-5 py-3 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>

            <button
              onClick={() => onOpenReportModal('found')}
              className="px-5 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Report Found Item</span>
            </button>

            <button
              onClick={onNavigateToMatches}
              className="px-5 py-3 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white rounded-lg border border-slate-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>View Matches ({matches.length})</span>
            </button>
          </div>

          {/* Real quantitative metrics strip with tabular numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
                {totalReports}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Total Documented</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono tabular-nums">
                {lostCount}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Active Lost Reports</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums">
                {foundCount}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Found Items in Custody</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
                {recoveredCount}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Safely Recovered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
