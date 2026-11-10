import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UCC_HALLS } from '../data/seedData';
import { X, ShieldCheck, GraduationCap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, showNotification } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [hall, setHall] = useState(UCC_HALLS[0]);
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        await signUp({ email, password, fullName, studentId, phone, hallOfResidence: hall, department });
        showNotification('Registration submitted. If email confirmation is enabled, verify your email before signing in.');
        setMode('signin');
        setPassword('');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-900">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold">CampusFind Account</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Secure access for the UCC campus community</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5">
            <button type="button" onClick={() => { setMode('signin'); setError(''); }} className={`py-2 rounded-lg text-sm font-semibold ${mode === 'signin' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}>Sign in</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); }} className={`py-2 rounded-lg text-sm font-semibold ${mode === 'signup' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}>Create account</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><GraduationCap className="w-4 h-4 text-blue-900" /> Student details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-700">Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal" /></label>
                  <label className="text-xs font-semibold text-slate-700">UCC index number<input required value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="e.g. BS/IT/24/0001" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal" /></label>
                  <label className="text-xs font-semibold text-slate-700">Phone number<input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal" /></label>
                  <label className="text-xs font-semibold text-slate-700">Hall / residence<select value={hall} onChange={e => setHall(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal">{UCC_HALLS.map(value => <option key={value}>{value}</option>)}</select></label>
                </div>
                <label className="block text-xs font-semibold text-slate-700">Department / programme<input required value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal" /></label>
              </>
            )}

            <label className="block text-xs font-semibold text-slate-700">Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal" /></label>
            <label className="block text-xs font-semibold text-slate-700">Password<input required type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal" />{mode === 'signup' && <span className="block mt-1 text-[11px] text-slate-400">At least 8 characters. Your password is handled securely by Supabase Auth.</span>}</label>

            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

            <button disabled={busy} type="submit" className="w-full rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm py-3">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in securely' : 'Create my account'}</button>
          </form>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-4">CampusFind never asks you to share your password with administrators. Administrator access is assigned separately by an authorized project administrator.</p>
        </div>
      </div>
    </div>
  );
};
