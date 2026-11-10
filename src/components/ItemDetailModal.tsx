import React, { useState } from 'react';
import { ItemReport } from '../types';
import { useApp } from '../context/AppContext';
import { calculateMatchScore } from '../utils/matching';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ItemDetailModalProps {
  item: ItemReport | null;
  onClose: () => void;
  onOpenClaim: (item: ItemReport) => void;
  onSelectRelated: (item: ItemReport) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenClaim,
  onSelectRelated
}) => {
  const { items, currentUser, markItemRecovered } = useApp();
  const [imageError, setImageError] = useState(false);

  if (!item) return null;

  const isLost = item.type === 'lost';
  const isRecovered = item.status === 'recovered';
  const isOwner = !!currentUser && currentUser.studentId === item.reporterStudentId;
  const isAdmin = currentUser?.role === 'admin';

  // Find candidate matches for this specific item
  const potentialMatches = items
    .filter((other) => other.id !== item.id && other.type !== item.type)
    .map((other) => {
      const lost = isLost ? item : other;
      const found = isLost ? other : item;
      const result = calculateMatchScore(lost, found);
      return { other, result };
    })
    .filter((entry) => entry.result !== null && entry.result.score >= 40)
    .sort((a, b) => (b.result?.score || 0) - (a.result?.score || 0));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`font-semibold uppercase tracking-wider px-2 py-0.5 rounded text-[11px] ${
                isLost ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isLost ? 'Lost Item Report' : 'Found Item Record'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-slate-500 tabular-nums">ID: {item.id}</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Main Visual */}
          {item.imageUrl && !imageError ? (
            <div className="rounded-xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200">
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-xl p-8 bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                  isLost ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isLost ? <AlertCircle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
              </div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                No photo uploaded with initial report. Verify using description and distinctive marks.
              </p>
            </div>
          )}

          {/* Title and Status */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <span>Color: {item.color}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize font-medium text-slate-700">{item.status.replace('_', ' ')}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{item.title}</h2>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Description & Circumstances
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {item.description}
            </p>
          </div>

          {/* Distinct Marks (Private / Key Identifiers) */}
          {item.distinctMarks && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-900" />
                <span>Distinctive Ownership Marks</span>
              </h4>
              <div className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-xl">
                {item.distinctMarks}
              </div>
            </div>
          )}

          {/* Location & Custody Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-900" />
                <span>Campus Location</span>
              </div>
              <div className="text-slate-700 font-medium">{item.campusLocation}</div>
              {item.specificSpot && (
                <div className="text-slate-500 text-[11px]">Spot: {item.specificSpot}</div>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-900" />
                <span>Incident Timeline</span>
              </div>
              <div className="text-slate-700 font-mono tabular-nums">
                Date: {item.dateEvent}
              </div>
              <div className="text-slate-500 text-[11px] font-mono tabular-nums">
                Logged: {new Date(item.dateReported).toLocaleDateString()}
              </div>
            </div>

            {/* Custody / Holding Point for Found Items */}
            {!isLost && item.storageLocation && (
              <div className="sm:col-span-2 bg-emerald-50/60 border border-emerald-200/70 p-3.5 rounded-xl space-y-1">
                <div className="font-semibold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <span>Current Physical Custody / Collection Point</span>
                </div>
                <div className="text-xs text-emerald-800 font-medium">
                  {item.storageLocation}
                </div>
                <div className="text-[11px] text-emerald-700">
                  Proof of ownership and student identity card will be required during collection.
                </div>
              </div>
            )}
          </div>

          {/* Reporter Information Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Reported By</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Name:</span>{' '}
                <span className="font-medium text-slate-800">{item.reporterName}</span>
              </div>
              <div>
                <span className="text-slate-400">Student ID:</span>{' '}
                <span className="font-mono text-slate-800">{item.reporterStudentId}</span>
              </div>
              <div>
                <span className="text-slate-400">Hall of Residence:</span>{' '}
                <span className="text-slate-800">{item.reporterHall}</span>
              </div>
              <div>
                <span className="text-slate-400">Contact:</span>{' '}
                <span className="font-mono text-slate-800">{item.reporterPhone}</span>
              </div>
            </div>
          </div>

          {/* Potential Candidate Matches Section */}
          {potentialMatches.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Automated Match Suggestions ({potentialMatches.length})
                </h4>
              </div>
              <div className="space-y-2">
                {potentialMatches.map(({ other, result }) => (
                  <div
                    key={other.id}
                    onClick={() => onSelectRelated(other)}
                    className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900">{other.title}</span>
                        <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[11px]">
                          {result?.score}% Match
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {other.campusLocation} · {other.dateEvent}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {(isOwner || isAdmin) && !isRecovered && (
              <button
                onClick={() => {
                  markItemRecovered(item.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Recovered</span>
              </button>
            )}

            {!isLost && (item.status === 'open' || item.status === 'in_review') && (
              <button
                onClick={() => {
                  onClose();
                  onOpenClaim(item);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Submit Ownership Claim</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
