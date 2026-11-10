import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MatchSuggestion, ItemReport } from '../types';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Search, Sparkles, XCircle, ZoomIn } from 'lucide-react';

const confidenceLabel = (score: number) => score >= 80 ? 'High confidence' : score >= 60 ? 'Moderate confidence' : 'Possible match';

interface MatchReviewQueueProps {}

export const MatchReviewQueue: React.FC<MatchReviewQueueProps> = () => {
  const { items, matchSuggestions, reviewMatchSuggestion, showNotification } = useApp();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MatchSuggestion | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; title: string } | null>(null);

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const visibleSuggestions = matchSuggestions.filter((suggestion) => {
    if (filter === 'pending' && suggestion.status !== 'pending') return false;
    const lost = itemById.get(suggestion.lostReportId);
    const found = itemById.get(suggestion.foundReportId);
    if (!lost || !found) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return [lost.title, lost.category, lost.campusLocation, found.title, found.category, found.campusLocation]
      .some((value) => value.toLowerCase().includes(term));
  });

  const openDecision = (suggestion: MatchSuggestion, next: 'approved' | 'rejected') => {
    setSelected(suggestion);
    setDecision(next);
    setNotes('');
  };

  const submitDecision = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await reviewMatchSuggestion(selected.id, decision, notes);
      setSelected(null);
    } catch (error: any) {
      showNotification(error?.message || 'Unable to save the match decision.');
    } finally {
      setSaving(false);
    }
  };

  const renderReport = (item: ItemReport, type: 'lost' | 'found') => (
    <section className={`rounded-xl border p-3 sm:p-4 min-w-0 ${type === 'lost' ? 'border-rose-200 bg-rose-50/40' : 'border-emerald-200 bg-emerald-50/40'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-[11px] font-bold uppercase tracking-wide ${type === 'lost' ? 'text-rose-700' : 'text-emerald-700'}`}>
          {type === 'lost' ? 'Lost report' : 'Found report'}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{item.dateEvent}</span>
      </div>
      {item.imageUrl ? (
        <button type="button" onClick={() => setZoomedPhoto({ url: item.imageUrl!, title: item.title })} className="group relative block w-full mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img src={item.imageUrl} alt={`Uploaded photo for ${item.title}`} className="h-44 sm:h-52 w-full object-contain bg-slate-100" />
          <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white inline-flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Enlarge photo</span>
        </button>
      ) : (
        <div className="h-44 sm:h-52 mb-3 rounded-lg border border-dashed border-slate-300 bg-white/70 flex items-center justify-center text-xs text-slate-400">
          No photo was attached to this report
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
      <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{item.campusLocation}</div>
        <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 shrink-0" />{item.dateEvent}</div>
        <div><span className="font-semibold">Category:</span> {item.category}</div>
        <div><span className="font-semibold">Colour:</span> {item.color || 'Not specified'}</div>
        <div><span className="font-semibold">Reported by:</span> {item.reporterName}</div>
        {item.storageLocation && <div><span className="font-semibold">Stored at:</span> {item.storageLocation}</div>}
        {item.distinctMarks && <div><span className="font-semibold">Distinctive details:</span> {item.distinctMarks}</div>}
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /><h3 className="text-base font-bold text-slate-900">Automated Match Review Queue</h3></div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">CampusFind compares open lost and found reports and ranks possible pairs. Review the original photos and evidence before making the final decision.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => setFilter('pending')} className={`px-3 py-2 rounded-lg font-semibold ${filter === 'pending' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Pending ({matchSuggestions.filter((s) => s.status === 'pending').length})</button>
          <button onClick={() => setFilter('all')} className={`px-3 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'}`}>All decisions</button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <Search className="w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by item, category, or campus location..." className="w-full text-xs outline-none" />
      </div>

      {visibleSuggestions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Clock3 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">{filter === 'pending' ? 'No pending candidate matches' : 'No match suggestions found'}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">When a student submits a lost report and another student submits a compatible found report, CampusFind will score the pair and place it here for administrator review.</p>
        </div>
      ) : visibleSuggestions.map((suggestion) => {
        const lost = itemById.get(suggestion.lostReportId)!;
        const found = itemById.get(suggestion.foundReportId)!;
        return (
          <article key={suggestion.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800">{confidenceLabel(suggestion.score)}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">{suggestion.status.toUpperCase()}</span>
              </div>
              <div className="text-sm font-bold font-mono text-amber-800 bg-amber-100 rounded-md px-2.5 py-1">{suggestion.score}% match score</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
              {renderReport(lost, 'lost')}
              {renderReport(found, 'found')}
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">Why this pair was suggested</div>
                {suggestion.evidence.length ? <ul className="space-y-1">{suggestion.evidence.map((reason, index) => <li key={index} className="text-xs text-slate-600 flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />{reason}</li>)}</ul> : <p className="text-xs text-slate-500">No additional evidence was recorded.</p>}
              </div>
              {suggestion.status === 'pending' ? (
                <div className="flex flex-wrap justify-end gap-2 mt-3">
                  <button onClick={() => openDecision(suggestion, 'rejected')} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><XCircle className="w-4 h-4" /> Reject suggestion</button>
                  <button onClick={() => openDecision(suggestion, 'approved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"><CheckCircle2 className="w-4 h-4" /> Approve match</button>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">Decision recorded {suggestion.reviewedAt ? `on ${new Date(suggestion.reviewedAt).toLocaleString()}` : ''}{suggestion.reviewNotes ? ` — ${suggestion.reviewNotes}` : ''}</div>
              )}
            </div>
          </article>
        );
      })}

      {selected && (
        <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-base font-bold text-slate-900">{decision === 'approved' ? 'Approve potential match?' : 'Reject potential match?'}</h3><p className="text-xs text-slate-500 mt-1">This records your administrator decision. It does not mark the item as recovered or approve an ownership claim.</p></div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close">✕</button>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700"><strong>{itemById.get(selected.lostReportId)?.title}</strong> ↔ <strong>{itemById.get(selected.foundReportId)?.title}</strong><div className="mt-1 text-slate-500">Confidence score: {selected.score}%</div></div>
            <label className="block text-xs font-semibold text-slate-700">Administrator decision notes *
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Explain why this pair is a valid or invalid match..." className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:ring-2 focus:ring-blue-900" />
            </label>
            <div className="flex justify-end gap-2"><button onClick={() => setSelected(null)} className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving || !notes.trim()} onClick={submitDecision} className={`px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 ${decision === 'approved' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'}`}>{saving ? 'Saving...' : decision === 'approved' ? 'Confirm approval' : 'Confirm rejection'}</button></div>
          </div>
        </div>
      )}

      {zoomedPhoto && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-4" onClick={() => setZoomedPhoto(null)}>
          <button className="absolute top-5 right-5 text-white text-2xl" onClick={() => setZoomedPhoto(null)} aria-label="Close photo">×</button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}><p className="text-white text-sm font-semibold mb-3">{zoomedPhoto.title} — uploaded report photo</p><img src={zoomedPhoto.url} alt={zoomedPhoto.title} className="max-h-[80vh] w-full object-contain rounded-xl bg-black" /></div>
        </div>
      )}
    </div>
  );
};
