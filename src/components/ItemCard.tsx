import React, { useState } from 'react';
import { ItemReport } from '../types';
import { MapPin, Calendar, CheckCircle2, AlertCircle, ArrowUpRight, HelpCircle } from 'lucide-react';

interface ItemCardProps {
  item: ItemReport;
  onSelect: (item: ItemReport) => void;
  onClaim: (item: ItemReport) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect, onClaim }) => {
  const [imageError, setImageError] = useState(false);

  const isLost = item.type === 'lost';
  const isRecovered = item.status === 'recovered';

  return (
    <div
      onClick={() => onSelect(item)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all flex flex-col cursor-pointer"
    >
      {/* Visual Asset or Styled Fallback */}
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
              isLost ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isLost ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <span className="text-xs font-semibold text-slate-700 line-clamp-1">{item.category}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{item.color}</span>
          </div>
        )}

        {/* Minimal text indicator overlay with measured scrim */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-white/90 backdrop-blur-xs shadow-xs">
          {isRecovered ? (
            <span className="text-emerald-700">✓ Recovered</span>
          ) : isLost ? (
            <span className="text-rose-700 font-bold">Lost Item</span>
          ) : (
            <span className="text-emerald-700 font-bold">Found Item</span>
          )}
        </div>

        {item.rewardOffered && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/90 text-white backdrop-blur-xs">
            Reward: {item.rewardOffered}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Zero-Pill Unboxed Metadata with Typographic Separator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">{item.category}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{item.color}</span>
            {(item.claimsCount ?? 0) > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-amber-700 font-medium">{item.claimsCount} claim(s)</span>
              </>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1 text-base mb-1">
            {item.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Location & Date Footer */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.campusLocation}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{item.dateEvent}</span>
            </div>

            <div className="flex items-center gap-2">
              {!isLost && !isRecovered && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaim(item);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded transition-colors"
                >
                  Claim
                </button>
              )}
              <span className="text-blue-900 font-medium flex items-center text-xs group-hover:translate-x-0.5 transition-transform">
                View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
