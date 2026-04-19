import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const inputBase =
  'w-full px-4 py-3 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-[#0A1628] dark:text-[#E2EEFF] dark:border-[#1E3A5F] dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const inputError =
  'w-full px-4 py-3 text-base text-slate-800 bg-slate-50 border border-red-400 rounded-xl ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ' +
  'dark:bg-[#0A1628] dark:text-[#E2EEFF] dark:border-red-500 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const TIMER_SECONDS = 600; // 10 minutes

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  // Step 1: email entry — Step 2: OTP entry
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(navState.email || '');
  const [emailError, setEmailError] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const inputRefs = useRef([]);

  // Countdown timer — only runs on step 2
  useEffect(() => {
    if (step !== 2) return;
    setTimeLeft(TIMER_SECONDS);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setEmailError('');
    setSendError('');
    if (!email.trim()) { setEmailError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email'); return; }

    setSendLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch {
      setSendError('Something went wrong. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  // ── Step 2: OTP input handlers ────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    setOtpError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setOtpDigits(updated);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) { setOtpError('Please enter all 6 digits'); return; }

    setVerifyLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      sessionStorage.setItem('reset_token', res.data.data.reset_token);
      navigate('/reset-password');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setSendError('');
    setOtpError('');
    setOtpDigits(['', '', '', '', '', '']);
    setResendLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setTimeLeft(TIMER_SECONDS);
      inputRefs.current[0]?.focus();
    } catch {
      setSendError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <style>{`
        body, #root, .otp-bg-fixed {
          min-height: 100vh;
        }
        .otp-bg-fixed {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(to right, #BFDBFE, #DBEAFE,#EFF6FF);
        }
        .dark .otp-bg-fixed {
          background: linear-gradient(to right, #0B1D3A, #0F2952, #1A3A6E) !important;
        }
      `}</style>
      <div className="otp-bg-fixed" aria-hidden="true" />
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white dark:bg-[#0F1E35] rounded-2xl border border-slate-200 dark:border-[#1E3358] shadow-sm px-10 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {step === 1 ? 'Forgot Password' : 'Enter Verification Code'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#7B98C4] mt-1.5">
              {step === 1
                ? navState.reason === 'expired'
                  ? 'Your password has expired. Enter your email to reset it.'
                  : 'Enter your email and we\'ll send you a 6-digit code.'
                : `We sent a code to ${email}`}
            </p>
          </div>

          {/* ── Step 1: Email form ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email address"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  className={emailError ? inputError : inputBase}
                />
                {emailError && <p className="mt-1 text-xs text-red-500" role="alert" aria-live="polite">{emailError}</p>}
              </div>

              {sendError && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg" role="alert">
                  {sendError}
                </div>
              )}

              <button
                type="submit"
                disabled={sendLoading}
                aria-label="Send verification code"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sendLoading ? (
                  <span className="flex items-center justify-center gap-2"><Spinner /> Sending…</span>
                ) : 'Send Code'}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP form ── */}
          {step === 2 && (
            <form onSubmit={handleVerify} noValidate className="space-y-6">

              {/* 6-digit input boxes */}
              <div>
                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      aria-label={`OTP digit ${i + 1}`}
                      className={`w-11 h-12 text-center text-lg font-semibold text-slate-800 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 dark:bg-slate-700 dark:text-slate-100
                        ${otpError
                          ? 'border-red-400 focus:ring-red-500 dark:border-red-500'
                          : 'border-slate-200 focus:ring-blue-500 dark:border-slate-600'}`}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="mt-3 text-xs text-red-500 text-center" role="alert" aria-live="polite">{otpError}</p>
                )}
              </div>

              {/* Countdown timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Code expires in{' '}
                    <span className={`font-semibold ${timeLeft <= 60 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-red-500" role="alert" aria-live="polite">Your code has expired. Please request a new one.</p>
                )}
              </div>

              {sendError && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg" role="alert" aria-live="polite">
                  {sendError}
                </div>
              )}

              {timeLeft > 0 ? (
                <button
                  type="submit"
                  disabled={verifyLoading}
                  aria-label="Verify OTP code"
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {verifyLoading ? (
                    <span className="flex items-center justify-center gap-2"><Spinner /> Verifying…</span>
                  ) : 'Verify Code'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  aria-label="Resend OTP code"
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {resendLoading ? (
                    <span className="flex items-center justify-center gap-2"><Spinner /> Sending…</span>
                  ) : 'Resend OTP'}
                </button>
              )}

              <button
                type="button"
                aria-label="Change email address"
                onClick={() => { setStep(1); setOtpDigits(['', '', '', '', '', '']); setOtpError(''); }}
                className="w-full px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors duration-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Change email
              </button>
            </form>
          )}

          {/* Back to login */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              ← Back to login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default OTP;
