import React from 'react';
import heroCampusImage from '../assets/images/ucc_campus_hero_1794334426172.jpg';
import { useApp } from '../context/AppContext';
import { PlusCircle, CheckCircle2 } from 'lucide-react';

interface HeroBannerProps {
  onOpenReportModal: (type?: 'lost' | 'found') => void;
  onSearchFocus: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenReportModal,
  onSearchFocus
}) => {
  const { items } = useApp();

  const totalReports = items.length;
  const lostCount = items.filter((i) => i.type === 'lost' && i.status !== 'recovered').length;
  const foundCount = items.filter((i) => i.type === 'found' && i.status !== 'recovered').length;
  const recoveredCount = items.filter((i) => i.status === 'recovered').length;

  return (
    <div className="group relative mb-10 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,.18)]">
      {/* Background Campus Image with measured contrast scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroCampusImage}
          alt="University of Cape Coast Campus"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-35 brightness-90 transition duration-[1800ms] group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/55" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(251,191,36,.18),transparent_28rem)]" />
      </div>

      <div className="relative z-10 p-7 sm:p-11 lg:p-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-3 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>University of Cape Coast · Directorate of University Security</span>
          </div>

          <h1 className="mb-5 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-.045em] text-white text-balance sm:text-5xl lg:text-6xl">
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
              className="flex items-center gap-2 rounded-xl border border-rose-300/20 bg-gradient-to-r from-rose-700 to-rose-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-950/25 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>

            <button
              onClick={() => onOpenReportModal('found')}
              className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/25 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Report Found Item</span>
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
