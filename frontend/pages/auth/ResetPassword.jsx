import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const CRITERIA = [
  { key: 'length',    label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { key: 'uppercase', label: 'At least 1 uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { key: 'number',    label: 'At least 1 number',            test: (p) => /\d/.test(p) },
  { key: 'special',   label: 'At least 1 special character', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

const CheckItem = ({ met, label }) => (
  <li className="flex items-center gap-2 text-sm">
    {met ? (
      <svg className="h-4 w-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )}
    <span className={met ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
      {label}
    </span>
  </li>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [passwordReuseError, setPasswordReuseError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [success, setSuccess] = useState(false);

  // Guard: if no reset token redirect to /otp
  useEffect(() => {
    if (!sessionStorage.getItem('reset_token')) {
      navigate('/otp', { replace: true });
    }
  }, [navigate]);

  const allMet = CRITERIA.every(c => c.test(password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setPasswordReuseError('');
    setConfirmError('');

    if (!allMet) {
      setServerError('Password does not meet requirements.');
      return;
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match');
      return;
    }

    const reset_token = sessionStorage.getItem('reset_token');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { reset_token, password });
      sessionStorage.removeItem('reset_token');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('reuse') || msg.toLowerCase().includes('last 5')) {
        setPasswordReuseError(msg);
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeButton = ({ show, onToggle, label }) => (
    <button type="button" aria-label={label} onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
      {show ? (
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
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <style>{`
        body, #root, .reset-bg-fixed {
          min-height: 100vh;
        }
        .reset-bg-fixed {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(to right, #BFDBFE, #DBEAFE,#EFF6FF);
        }
        .dark .reset-bg-fixed {
          background: linear-gradient(to right, #0B1D3A, #0F2952, #1A3A6E) !important;
        }
      `}</style>
      <div className="reset-bg-fixed" aria-hidden="true" />
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white dark:bg-[#0F1E35] rounded-2xl border border-slate-200 dark:border-[#1E3358] shadow-sm px-10 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">Reset Password</h1>
            <p className="text-sm text-slate-500 dark:text-[#7B98C4] mt-1.5">Choose a strong new password</p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your password has been reset. Please log in.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-label="New password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setServerError(''); setPasswordReuseError(''); }}
                  className={`${inputBase} pr-11`}
                />
                <EyeButton show={showPassword} onToggle={() => setShowPassword(v => !v)} label={showPassword ? 'Hide password' : 'Show password'} />
              </div>

              {passwordReuseError && (
                <p className="mt-1 text-xs text-red-500" role="alert" aria-live="polite">{passwordReuseError}</p>
              )}

              {/* Live checklist */}
              {password.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {CRITERIA.map(c => (
                    <CheckItem key={c.key} met={c.test(password)} label={c.label} />
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-label="Confirm new password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setConfirmError(''); }}
                  className={`${confirmError ? inputError : inputBase} pr-11`}
                />
                <EyeButton show={showConfirm} onToggle={() => setShowConfirm(v => !v)} label={showConfirm ? 'Hide password' : 'Show password'} />
              </div>
              {confirmError && <p className="mt-1 text-xs text-red-500" role="alert">{confirmError}</p>}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg" role="alert" aria-live="assertive">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              aria-label="Reset my password"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Spinner /> Resetting…</span>
              ) : 'Reset Password'}
            </button>
          </form>

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

export default ResetPassword;
