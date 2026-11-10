import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ItemReport, MatchScoreResult } from '../types';
import { Sparkles, ArrowRight, CheckCircle2, MapPin, Calendar, Check, ExternalLink } from 'lucide-react';

interface MatchesViewProps {
  onSelectItem: (item: ItemReport) => void;
  onClaimItem: (item: ItemReport) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({ onSelectItem, onClaimItem }) => {
  const { matches, markItemRecovered } = useApp();
  const [minScore, setMinScore] = useState<number>(40);

  const filteredMatches = matches.filter((m) => m.score >= minScore);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Rule-Based Match Engine
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl">
            Correlates lost reports against found custody logs using item category, color,
            UCC campus zone proximity, lexical token overlap, and timeline alignment.
          </p>
        </div>

        {/* Filter by Match Confidence */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Confidence:</span>
          <select
            aria-label="Filter by Confidence"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900 font-medium"
          >
            <option value={40}>All Viable Matches (40%+)</option>
            <option value={60}>Moderate Confidence (60%+)</option>
            <option value={80}>High Probability (80%+)</option>
          </select>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Sparkles className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">No candidate matches at this threshold</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try lowering the confidence threshold to view broader potential correlations across UCC lecture halls.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(({ lostItem, foundItem, score, reasons }, idx) => (
            <div
              key={`${lostItem.id}-${foundItem.id}`}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs overflow-hidden transition-all"
            >
              {/* Match Header Bar */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Match Pair #{idx + 1}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{lostItem.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 tabular-nums">
                    {score}% Match Probability
                  </div>
                </div>
              </div>

              {/* Pair Comparison Body */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Left: Lost Item */}
                <div className="md:col-span-5 bg-rose-50/40 border border-rose-100 rounded-xl p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wide mb-1 flex items-center justify-between">
                      <span>Lost Report</span>
                      <span className="font-mono text-slate-400 text-[10px]">{lostItem.dateEvent}</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-1">
                      {lostItem.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {lostItem.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-rose-100 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{lostItem.campusLocation}</span>
                    </div>
                    <div>
                      Reporter: <span className="font-medium text-slate-700">{lostItem.reporterName}</span>
                    </div>
                    <button
                      onClick={() => onSelectItem(lostItem)}
                      className="text-xs font-semibold text-rose-700 hover:underline pt-1 inline-flex items-center gap-1"
                    >
                      <span>Inspect Lost Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Center: Match Breakdown Reasons */}
                <div className="md:col-span-2 flex flex-col items-center justify-center py-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs mb-2">
                    {score}%
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 mb-1">
                    Score Factors
                  </span>
                  <div className="space-y-1 text-left w-full">
                    {reasons.slice(0, 3).map((r, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Found Item */}
                <div className="md:col-span-5 bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-1 flex items-center justify-between">
                      <span>Found Custody Log</span>
                      <span className="font-mono text-slate-400 text-[10px]">{foundItem.dateEvent}</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-1">
                      {foundItem.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {foundItem.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-emerald-100 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{foundItem.campusLocation}</span>
                    </div>
                    <div>
                      Holding at: <span className="font-medium text-slate-700">{foundItem.storageLocation || 'Finder'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => onSelectItem(foundItem)}
                        className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Inspect Found Record</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onClaimItem(foundItem)}
                        className="px-3 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-xs transition-colors"
                      >
                        Submit Claim
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
