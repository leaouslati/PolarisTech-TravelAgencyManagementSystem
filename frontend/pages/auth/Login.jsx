import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1 state
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [lockoutMinutes, setLockoutMinutes] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // MFA step 2 state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEmail, setMfaEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const otpRefs = useRef([]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    setLockoutMinutes(null);
    try {
      const res = await api.post('/auth/login', data);

      if (res.data.status === 'password_expired') {
        navigate('/otp', { state: { email: data.email, reason: 'expired' } });
        return;
      }

      if (res.data.status === 'mfa_required') {
        setMfaEmail(data.email);
        setMfaRequired(true);
        return;
      }

      const { token, user } = res.data.data;
      login(user, token);
      redirectByRole(user.role);
    } catch (err) {
      if (err.response?.data?.status === 'locked') {
        setLockoutMinutes(err.response.data.data?.minutes_remaining ?? 15);
      } else {
        if (err.response?.status === 401) setFailedAttempts(prev => prev + 1);
        setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'Customer') navigate('/customer/dashboard');
    else if (role === 'TravelAgent') navigate('/agent/dashboard');
    else if (role === 'Administrator') navigate('/admin/dashboard');
  };

  const handleOtpDigitChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    setOtpError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setOtpDigits(updated);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) { setOtpError('Please enter all 6 digits'); return; }

    setMfaLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-mfa', { email: mfaEmail, otp: code });
      const { token, user } = res.data.data;
      login(user, token);
      redirectByRole(user.role);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired verification code');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setMfaLoading(false);
    }
  };

  const remaining = 5 - failedAttempts;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <style>{`
        .dark .login-bg {
          background: linear-gradient(to right, #0B1D3A, #0F2952, #1A3A6E) !important;
        }
      `}</style>

      <div
        className="login-bg min-h-screen w-full absolute inset-0"
        style={{ background: 'linear-gradient(to right, #BFDBFE, #DBEAFE,#EFF6FF)' }}
      />

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white dark:bg-[#0F1E35] rounded-2xl border border-slate-200 dark:border-[#1E3358] shadow-sm px-10 py-10">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              PolarisTech
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#7B98C4] mt-1.5">
              {mfaRequired ? `Enter the code sent to ${mfaEmail}` : 'Sign in to your account'}
            </p>
          </div>

          {/* ── MFA Step ── */}
          {mfaRequired ? (
            <form onSubmit={handleMfaVerify} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#94B4D4] mb-3 text-center">
                  Verification Code
                </label>
                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigitChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      aria-label={`Digit ${i + 1}`}
                      className={`w-11 h-12 text-center text-lg font-semibold text-slate-800 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 dark:bg-slate-700 dark:text-slate-100
                        ${otpError
                          ? 'border-red-400 focus:ring-red-500 dark:border-red-500'
                          : 'border-slate-200 focus:ring-blue-500 dark:border-slate-600'}`}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="mt-3 text-xs text-red-500 text-center" role="alert">{otpError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={mfaLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mfaLoading ? (
                  <span className="flex items-center justify-center gap-2"><Spinner /> Verifying…</span>
                ) : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => { setMfaRequired(false); setOtpDigits(['', '', '', '', '', '']); setOtpError(''); }}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                ← Back
              </button>
            </form>
          ) : (
            /* ── Password Step ── */
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-[#94B4D4] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-label="Email address"
                  aria-invalid={!!errors.email}
                  placeholder="you@example.com"
                  className={errors.email ? inputError : inputBase}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
                  })}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500" role="alert" aria-live="polite">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-[#94B4D4] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-label="Password"
                    aria-invalid={!!errors.password}
                    placeholder="••••••••"
                    className={`${errors.password ? inputError : inputBase} pr-11`}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500" role="alert" aria-live="polite">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Failed attempts warning */}
              {failedAttempts >= 3 && remaining > 0 && (
                <div
                  className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm px-4 py-3 rounded-xl"
                  role="alert"
                  aria-live="assertive"
                >
                  <svg className="h-4 w-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>{remaining} attempt{remaining !== 1 ? 's' : ''}</strong> remaining before your account is locked for 15 minutes.
                  </span>
                </div>
              )}

              {/* Lockout banner */}
              {lockoutMinutes !== null && (
                <div
                  className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl"
                  role="alert"
                  aria-live="assertive"
                >
                  <svg className="h-4 w-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Account locked due to too many failed attempts. Try again in{' '}
                    <strong>{lockoutMinutes} minute{lockoutMinutes !== 1 ? 's' : ''}</strong>.
                  </span>
                </div>
              )}

              {/* Server error */}
              {serverError && !lockoutMinutes && (
                <div
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl"
                  role="alert"
                  aria-live="assertive"
                >
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-label="Sign in"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          )}

          {/* Footer links */}
          {!mfaRequired && (
            <div className="mt-6 space-y-2 text-center">
              <div>
                <Link to="/otp" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-[#7B98C4]">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Register
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;