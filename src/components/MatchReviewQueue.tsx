import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MatchSuggestion, ItemReport } from '../types';
import {
  CalendarDays, CheckCircle2, Clock3, MapPin, RefreshCw, Search,
  Sparkles, XCircle, ZoomIn, ShieldCheck, ArrowUpRight, Package,
  ScanSearch, Palette, Layers3, Timer, Info
} from 'lucide-react';

const confidenceLabel = (score: number) =>
  score >= 80 ? 'High confidence' : score >= 60 ? 'Moderate confidence' : 'Possible match';

const normalized = (value?: string | null) => (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const compareText = (left?: string | null, right?: string | null) => {
  if (!left || !right) return 'unknown';
  return normalized(left) === normalized(right) ? 'match' : 'different';
};

const daysApart = (left?: string, right?: string) => {
  if (!left || !right) return null;
  const a = new Date(left);
  const b = new Date(right);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 86400000));
};

interface MatchReviewQueueProps {}

export const MatchReviewQueue: React.FC<MatchReviewQueueProps> = () => {
  const { items, matchSuggestions, reviewMatchSuggestion, refreshData, loading, showNotification } = useApp();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MatchSuggestion | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; title: string } | null>(null);

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const visibleSuggestions = useMemo(() => matchSuggestions.filter((suggestion) => {
    if (filter === 'pending' && suggestion.status !== 'pending') return false;
    const lost = itemById.get(suggestion.lostReportId);
    const found = itemById.get(suggestion.foundReportId);
    if (!lost || !found) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return [lost.title, lost.category, lost.campusLocation, found.title, found.category, found.campusLocation]
      .some((value) => value.toLowerCase().includes(term));
  }), [matchSuggestions, filter, search, itemById]);

  const activeSuggestion = visibleSuggestions.find((suggestion) => suggestion.id === activeId) || visibleSuggestions[0] || null;
  const lost = activeSuggestion ? itemById.get(activeSuggestion.lostReportId) : undefined;
  const found = activeSuggestion ? itemById.get(activeSuggestion.foundReportId) : undefined;

  const pendingCount = matchSuggestions.filter((suggestion) => suggestion.status === 'pending').length;
  const approvedCount = matchSuggestions.filter((suggestion) => suggestion.status === 'approved').length;
  const rejectedCount = matchSuggestions.filter((suggestion) => suggestion.status === 'rejected').length;

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

  const statusStyle = (status: string) => {
    if (status === 'match') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (status === 'different') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-50 text-slate-500';
  };

  const comparison = (label: string, left?: string | null, right?: string | null, icon?: React.ReactNode) => {
    const result = compareText(left, right);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">{icon}{label}</div>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle(result)}`}>
            {result === 'match' ? 'Same' : result === 'different' ? 'Different' : 'Not supplied'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="min-w-0"><div className="text-[10px] uppercase text-slate-400 mb-1">Lost</div><div className="font-semibold text-slate-800 break-words">{left || 'Not provided'}</div></div>
          <div className="min-w-0"><div className="text-[10px] uppercase text-slate-400 mb-1">Found</div><div className="font-semibold text-slate-800 break-words">{right || 'Not provided'}</div></div>
        </div>
      </div>
    );
  };

  const renderReport = (item: ItemReport, type: 'lost' | 'found') => (
    <section className={`rounded-2xl border p-3 sm:p-4 min-w-0 ${type === 'lost' ? 'border-rose-200 bg-rose-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-[11px] font-extrabold uppercase tracking-wider ${type === 'lost' ? 'text-rose-700' : 'text-emerald-700'}`}>
          {type === 'lost' ? 'Lost item report' : 'Found item report'}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{item.dateEvent}</span>
      </div>
      {item.imageUrl ? (
        <button type="button" onClick={() => setZoomedPhoto({ url: item.imageUrl!, title: item.title })} className="group relative block w-full mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={item.imageUrl} alt={`Uploaded photo for ${item.title}`} className="h-44 sm:h-52 w-full object-contain bg-slate-100" />
          <span className="absolute bottom-2 right-2 rounded-lg bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-semibold text-white inline-flex items-center gap-1.5"><ZoomIn className="w-3 h-3" /> View original photo</span>
        </button>
      ) : (
        <div className="h-44 sm:h-52 mb-3 rounded-xl border border-dashed border-slate-300 bg-white/70 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
          <Package className="w-7 h-7" /> No photo attached
        </div>
      )}
      <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
      <div className="mt-3 space-y-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />{item.campusLocation}</div>
        <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 shrink-0 text-slate-400" />{item.dateEvent}</div>
        <div><span className="font-semibold">Category:</span> {item.category}</div>
        <div><span className="font-semibold">Colour:</span> {item.color || 'Not specified'}</div>
        <div><span className="font-semibold">Reported by:</span> {item.reporterName}</div>
        {item.storageLocation && <div><span className="font-semibold">Stored at:</span> {item.storageLocation}</div>}
        {item.distinctMarks && <div><span className="font-semibold">Distinctive details:</span> {item.distinctMarks}</div>}
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white p-5 sm:p-7 shadow-xl">
        <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-24 -bottom-28 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> CampusFind intelligence layer
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Match Command Centre</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">Review system-generated lost-and-found candidates, inspect the original evidence and make the final administrator decision.</p>
          </div>
          <button onClick={() => refreshData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh live queue
          </button>
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'All candidates', value: matchSuggestions.length, icon: <ScanSearch className="w-4 h-4" />, tint: 'text-blue-200' },
            { label: 'Awaiting review', value: pendingCount, icon: <Clock3 className="w-4 h-4" />, tint: 'text-amber-200' },
            { label: 'Approved', value: approvedCount, icon: <CheckCircle2 className="w-4 h-4" />, tint: 'text-emerald-200' },
            { label: 'Rejected', value: rejectedCount, icon: <XCircle className="w-4 h-4" />, tint: 'text-rose-200' }
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
              <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide ${metric.tint}`}>{metric.icon}{metric.label}</div>
              <div className="text-2xl font-black tabular-nums mt-2">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item, category or campus location..." className="w-full text-xs outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button onClick={() => setFilter('pending')} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === 'pending' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Pending ({pendingCount})</button>
          <button onClick={() => setFilter('all')} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>All decisions</button>
        </div>
      </div>

      {visibleSuggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 sm:p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-4"><ScanSearch className="w-7 h-7" /></div>
          <h4 className="text-base font-extrabold text-slate-900">{filter === 'pending' ? 'No pending candidate matches' : 'No match suggestions found'}</h4>
          <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">When a student submits a lost report and another student submits a compatible found report, CampusFind will score the pair and place it here for administrator review.</p>
          <button onClick={() => refreshData()} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-900 disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /> Check for candidates</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)] gap-4 items-start">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between px-1 pb-3">
              <div><h4 className="text-xs font-extrabold text-slate-900">Candidate matches</h4><p className="text-[10px] text-slate-400 mt-0.5">Select a pair to inspect</p></div>
              <span className="rounded-full bg-blue-50 text-blue-800 px-2 py-1 text-[10px] font-bold">{visibleSuggestions.length}</span>
            </div>
            <div className="space-y-2">
              {visibleSuggestions.map((suggestion) => {
                const pairLost = itemById.get(suggestion.lostReportId)!;
                const pairFound = itemById.get(suggestion.foundReportId)!;
                const isActive = activeSuggestion?.id === suggestion.id;
                return (
                  <button key={suggestion.id} onClick={() => setActiveId(suggestion.id)} className={`w-full text-left rounded-xl border p-3 transition-all ${isActive ? 'border-blue-800 bg-blue-50 shadow-sm ring-1 ring-blue-800/10' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500">MATCH · {suggestion.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-sm font-black tabular-nums ${suggestion.score >= 80 ? 'text-emerald-700' : suggestion.score >= 60 ? 'text-blue-800' : 'text-amber-700'}`}>{suggestion.score}%</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-slate-900 truncate">{pairLost.title}</div>
                    <div className="flex items-center gap-1.5 my-1 text-[10px] text-slate-400"><ArrowUpRight className="w-3 h-3" /> matched with</div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{pairFound.title}</div>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <span className="text-[10px] text-slate-500">{confidenceLabel(suggestion.score)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${suggestion.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : suggestion.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>{suggestion.status}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${suggestion.score >= 80 ? 'bg-emerald-500' : suggestion.score >= 60 ? 'bg-blue-600' : 'bg-amber-500'}`} style={{ width: `${Math.max(0, Math.min(100, suggestion.score))}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </aside>

          {activeSuggestion && lost && found && (
            <section className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200">Selected candidate · {activeSuggestion.id.slice(0, 8)}</div><h4 className="text-lg font-extrabold mt-1">{confidenceLabel(activeSuggestion.score)}</h4><p className="text-[11px] text-slate-300 mt-1">Overall score calculated by the CampusFind matching engine</p></div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-24 h-24 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="9" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke={activeSuggestion.score >= 80 ? '#42D6A0' : activeSuggestion.score >= 60 ? '#65B7FF' : '#F5C46A'} strokeWidth="9" strokeLinecap="round" strokeDasharray={263.9} strokeDashoffset={263.9 * (1 - Math.max(0, Math.min(100, activeSuggestion.score)) / 100)} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-black tabular-nums">{activeSuggestion.score}</span><span className="text-[9px] font-bold text-slate-300">OUT OF 100</span></div>
                      </div>
                      <div className="max-w-[120px]"><div className="text-xs font-bold text-white">{activeSuggestion.score >= 80 ? 'Strong signal' : activeSuggestion.score >= 60 ? 'Review carefully' : 'Needs more evidence'}</div><div className="text-[10px] text-slate-300 mt-1">Similarity score, not a probability of identity.</div></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
                  {renderReport(lost, 'lost')}
                  {renderReport(found, 'found')}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-extrabold text-slate-900">Match evidence breakdown</h4><p className="text-[11px] text-slate-500 mt-1">Side-by-side report attributes. No extra factor scores are fabricated.</p></div><Layers3 className="w-5 h-5 text-blue-800" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {comparison('Item category', lost.category, found.category, <Package className="w-3.5 h-3.5" />)}
                  {comparison('Colour', lost.color || 'Not specified', found.color || 'Not specified', <Palette className="w-3.5 h-3.5" />)}
                  {comparison('Campus location', lost.campusLocation, found.campusLocation, <MapPin className="w-3.5 h-3.5" />)}
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2 mb-2"><div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Timer className="w-3.5 h-3.5" /> Reported event dates</div><span className="rounded-full border border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5 text-[10px] font-bold">Timeline</span></div>
                    <div className="grid grid-cols-2 gap-2 text-xs"><div><div className="text-[10px] uppercase text-slate-400 mb-1">Lost</div><div className="font-semibold text-slate-800">{lost.dateEvent || 'Not provided'}</div></div><div><div className="text-[10px] uppercase text-slate-400 mb-1">Found</div><div className="font-semibold text-slate-800">{found.dateEvent || 'Not provided'}</div></div></div>
                    <div className="mt-2 text-[10px] text-slate-500">{daysApart(lost.dateEvent, found.dateEvent) === null ? 'Date difference unavailable' : `${daysApart(lost.dateEvent, found.dateEvent)} day(s) between reported event dates`}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-950 mb-2"><Sparkles className="w-4 h-4" /> Matching engine evidence</div>
                  {activeSuggestion.evidence.length ? <ul className="space-y-2">{activeSuggestion.evidence.map((reason, index) => <li key={index} className="flex items-start gap-2 text-xs text-blue-950/80"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />{reason}</li>)}</ul> : <p className="text-xs text-slate-600">The matching engine did not store additional explanation for this candidate.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-900" /><h4 className="text-sm font-extrabold text-slate-900">Administrator decision</h4></div><p className="text-[11px] text-slate-500 mt-1">Review the photos and evidence. The engine recommends; the admin decides.</p></div>
                  {activeSuggestion.status === 'pending' ? (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openDecision(activeSuggestion, 'rejected')} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50"><XCircle className="w-4 h-4" /> Reject suggestion</button>
                      <button onClick={() => openDecision(activeSuggestion, 'approved')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"><CheckCircle2 className="w-4 h-4" /> Approve match</button>
                    </div>
                  ) : (
                    <div className={`rounded-xl px-3 py-2 text-xs font-bold ${activeSuggestion.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{activeSuggestion.status.toUpperCase()} · {activeSuggestion.reviewedAt ? new Date(activeSuggestion.reviewedAt).toLocaleString() : 'Decision recorded'}</div>
                  )}
                </div>
                {activeSuggestion.reviewNotes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><strong>Admin notes:</strong> {activeSuggestion.reviewNotes}</p>}
                <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-500"><Info className="w-3.5 h-3.5 shrink-0" /> Approving a candidate records the match review decision only. It does not automatically mark an item recovered or approve an ownership claim.</div>
              </div>
            </section>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-base font-bold text-slate-900">{decision === 'approved' ? 'Approve potential match?' : 'Reject potential match?'}</h3><p className="text-xs text-slate-500 mt-1">This records your administrator decision. It does not mark the item as recovered or approve an ownership claim.</p></div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close">✕</button>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700"><strong>{itemById.get(selected.lostReportId)?.title}</strong> ↔ <strong>{itemById.get(selected.foundReportId)?.title}</strong><div className="mt-1 text-slate-500">Engine score: {selected.score}/100</div></div>
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
