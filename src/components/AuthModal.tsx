import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { UCC_HALLS } from '../data/seedData';
import campusHero from '../assets/images/ucc_campus_hero_1794334426172.jpg';
import {
  X, ShieldCheck, GraduationCap, Eye, EyeOff, ArrowRight,
  Search, PackageCheck, MapPin, Sparkles, LockKeyhole, ArrowLeft
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: (authenticated?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, verifyEmailOtp, signUp, showNotification } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [hall, setHall] = useState(UCC_HALLS[0]);
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authStage, setAuthStage] = useState<'form' | 'otp' | 'success'>('form');
  const [otp, setOtp] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(180);

  useEffect(() => {
    if (authStage !== 'otp' || otpExpiresAt === null) return;
    const updateCountdown = () => {
      setSecondsRemaining(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [authStage, otpExpiresAt]);
  const [otpFlow, setOtpFlow] = useState<'signup' | 'magiclink'>('magiclink');

  if (!isOpen) return null;

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError('');
    setShowPassword(false);
    setAuthStage('form');
    setOtp('');
    setOtpExpiresAt(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (authStage === 'otp') {
        if (!/^\d{6,8}$/.test(otp.trim())) throw new Error('Enter the verification code from your email.');
        if (secondsRemaining <= 0) throw new Error('This verification code has expired. Return to your account details and request a new code.');
        await verifyEmailOtp(email, otp, otpFlow);
        setAuthStage('success');
      } else if (mode === 'signin') {
        await signIn(email, password);
        setOtpFlow('magiclink');
        setOtp('');
        setOtpExpiresAt(Date.now() + 180 * 1000);
        setSecondsRemaining(180);
        setAuthStage('otp');
      } else {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        await signUp({ email, password, fullName, studentId, phone, hallOfResidence: hall, department });
        setOtpFlow('signup');
        setOtp('');
        setOtpExpiresAt(Date.now() + 180 * 1000);
        setSecondsRemaining(180);
        setAuthStage('otp');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";
  const labelClass = "block text-[11px] font-bold uppercase tracking-[.13em] text-slate-600";

  return (
    <div className="campus-auth-overlay fixed inset-0 z-[60] overflow-y-auto bg-slate-950">
      <div className="campus-auth-scene absolute inset-0">
        <img src={campusHero} alt="" className="campus-auth-backdrop" />
        <div className="campus-auth-shade" />
        <div className="campus-auth-orb campus-auth-orb-one" />
        <div className="campus-auth-orb campus-auth-orb-two" />
        <div className="campus-auth-grain" />
      </div>

      <button
        type="button"
        onClick={() => onClose(false)}
        aria-label="Return to CampusFind"
        className="absolute right-5 top-5 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-xl transition hover:bg-white/15"
      >
        <X className="h-4 w-4" /> <span className="hidden sm:inline">Back to CampusFind</span>
      </button>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:px-16 lg:py-12">
        <section className="campus-auth-copy mx-auto w-full max-w-2xl text-white">
          <div className="mb-9 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-[10px] font-black tracking-tight text-slate-950">UCC</span>
            <span className="text-[10px] font-bold uppercase tracking-[.22em] text-white/85">University of Cape Coast</span>
            <span className="h-1 w-1 rounded-full bg-amber-300" />
            <span className="text-[10px] font-medium text-white/65">Campus community</span>
          </div>

          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.3em] text-amber-300">
            <Sparkles className="h-4 w-4" /> A smarter campus. A safer way to recover.
          </p>
          <h1 className="max-w-xl text-5xl font-black leading-[1.04] tracking-[-.055em] sm:text-6xl xl:text-7xl">
            Lost something?
            <span className="mt-2 block bg-gradient-to-r from-amber-200 via-yellow-100 to-white bg-clip-text text-transparent">Let's bring it</span>
            <span className="block">back to you.</span>
          </h1>
          <p className="mt-7 max-w-lg text-sm leading-7 text-white/72 sm:text-base">
            Your UCC lost-and-found community, brought together in one place. Report an item, discover what has been found, and follow every step towards recovery.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="campus-auth-feature">
              <Search className="h-5 w-5 text-amber-300" />
              <span>Explore reports</span>
            </div>
            <div className="campus-auth-feature">
              <PackageCheck className="h-5 w-5 text-emerald-300" />
              <span>Verify ownership</span>
            </div>
            <div className="campus-auth-feature">
              <MapPin className="h-5 w-5 text-sky-300" />
              <span>Across UCC</span>
            </div>
          </div>

          <div className="mt-12 hidden items-center gap-3 text-[11px] text-white/55 sm:flex">
            <span className="flex -space-x-2">
              <span className="h-7 w-7 rounded-full border-2 border-slate-900 bg-amber-200" />
              <span className="h-7 w-7 rounded-full border-2 border-slate-900 bg-sky-200" />
              <span className="h-7 w-7 rounded-full border-2 border-slate-900 bg-emerald-200" />
            </span>
            <span>Built for the UCC community</span>
            <span className="text-white/25">•</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Secure account access</span>
          </div>
        </section>

        <section className="campus-auth-card-wrap mx-auto w-full max-w-[490px]">
          <div className="mb-4 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-[.2em] text-white/65">
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Secure student portal</span>
            <span>CampusFind / 01</span>
          </div>
          <div className="campus-auth-card overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-[0_35px_100px_rgba(0,0,0,.38)] backdrop-blur-2xl">
            <div className="relative overflow-hidden bg-slate-950 px-7 pb-7 pt-8 text-white sm:px-9">
              <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10" />
              <div className="absolute -right-3 -top-11 h-40 w-40 rounded-full border border-amber-300/20" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[.24em] text-amber-300">Welcome to CampusFind</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-[2rem]">{mode === 'signin' ? 'Good to see you.' : 'Join the community.'}</h2>
                  <p className="mt-1.5 text-xs text-slate-300">{mode === 'signin' ? 'Sign in to continue your campus journey.' : 'Create your UCC student account in minutes.'}</p>
                </div>
                <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right sm:block">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400">Access</p>
                  <p className="mt-1 text-xs font-bold text-white">UCC only</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-7 pt-6 sm:px-9 sm:pb-9">
              <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5">
                <button type="button" disabled={authStage === 'otp'} onClick={() => switchMode('signin')} className={`rounded-xl py-3 text-xs font-bold transition-all ${mode === 'signin' ? 'bg-white text-slate-950 shadow-md shadow-slate-200/80' : 'text-slate-500 hover:text-slate-900'} disabled:opacity-50`}>Sign in</button>
                <button type="button" disabled={authStage === 'otp'} onClick={() => switchMode('signup')} className={`rounded-xl py-3 text-xs font-bold transition-all ${mode === 'signup' ? 'bg-white text-slate-950 shadow-md shadow-slate-200/80' : 'text-slate-500 hover:text-slate-900'} disabled:opacity-50`}>Create account</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authStage === 'success' ? (
                  <div className="space-y-5 py-3 text-center" role="status" aria-live="polite">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-950">You're successfully signed in!</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Your email has been verified and your CampusFind account is ready.</p>
                    </div>
                    <button type="button" onClick={() => onClose(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5">
                      Continue to CampusFind <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : authStage === 'form' ? (
                  <>
                    {mode === 'signin' && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-950">
                        Password + email code
                        <span className="mt-1 block text-[11px] font-medium text-blue-800/75">Enter your password first, then verify the code sent to your email.</span>
                      </div>
                    )}

                    {mode === 'signup' && (
                      <>
                        <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-800"><GraduationCap className="h-4 w-4 text-blue-800" /> Student information</div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className={labelClass}>Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" placeholder="Your full name" className={fieldClass} /></label>
                          <label className={labelClass}>UCC index number<input required value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="e.g. BS/IT/24/0001" className={fieldClass} /></label>
                          <label className={labelClass}>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="Your contact number" className={fieldClass} /></label>
                          <label className={labelClass}>Hall / residence<select value={hall} onChange={e => setHall(e.target.value)} className={fieldClass}>{UCC_HALLS.map(value => <option key={value}>{value}</option>)}</select></label>
                        </div>
                        <label className={labelClass}>Department / programme<input required value={department} onChange={e => setDepartment(e.target.value)} placeholder="Your academic programme" className={fieldClass} /></label>
                      </>
                    )}

                    <label className={labelClass}>Email address
                      <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@stu.ucc.edu.gh" className={fieldClass} />
                    </label>
                    {(mode === 'signup' || mode === 'signin') && (
                      <label className={labelClass}>Password
                        <span className="relative mt-1.5 block">
                          <input required type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className={`${fieldClass} pr-12`} />
                          <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-0 right-1 flex items-center justify-center rounded-lg px-3 text-slate-400 transition hover:text-blue-900">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </span>
                        {mode === 'signup' && <span className="mt-1.5 block text-[10px] font-medium normal-case tracking-normal text-slate-400">Use at least 8 characters. Your password is secured by Supabase Auth.</span>}
                      </label>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-950"><ShieldCheck className="h-4 w-4" /> Check your email</div>
                      <p className="mt-2 text-xs leading-6 text-blue-900/75">We sent a one-time verification code to <strong>{email}</strong>. Enter the code below to {otpFlow === 'signup' ? 'activate your account' : 'finish signing in'}.</p>
                      <div className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${secondsRemaining > 0 ? 'bg-white text-blue-950' : 'bg-rose-100 text-rose-700'}`}>
                        <span>{secondsRemaining > 0 ? 'Code expires in' : 'Code expired'}</span>
                        <span className="font-mono tabular-nums">{Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:{(secondsRemaining % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    <label className={labelClass}>Email verification code
                      <input required disabled={secondsRemaining <= 0 || busy} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter the code from your email" className={`${fieldClass} text-center text-lg font-bold tracking-[.35em]`} />
                    </label>
                    <button type="button" onClick={() => { setAuthStage('form'); setOtp(''); setOtpExpiresAt(null); setError(''); }} className="text-xs font-semibold text-blue-800 transition hover:text-blue-950">← Return to account details</button>
                  </div>
                )}

                {authStage !== 'success' && error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">{error}</div>}

                {authStage !== 'success' && (
                  <button disabled={busy || (authStage === 'otp' && secondsRemaining <= 0)} type="submit" className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/25 disabled:cursor-wait disabled:opacity-60">
                    {busy ? 'Please wait…' : authStage === 'otp' ? (secondsRemaining <= 0 ? 'Code expired' : 'Verify code and continue') : mode === 'signin' ? 'Continue to email verification' : 'Create my account'}
                    {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                )}
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
                <LockKeyhole className="h-3.5 w-3.5" /> Your account details are protected
              </div>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400">Every sign-in requires email verification. Administrator access is assigned separately.</p>
            </div>
          </div>
          <button type="button" onClick={() => onClose(false)} className="mx-auto mt-5 flex items-center gap-2 text-xs font-semibold text-white/70 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Continue browsing without signing in
          </button>
        </section>
      </div>
    </div>
  );
};
