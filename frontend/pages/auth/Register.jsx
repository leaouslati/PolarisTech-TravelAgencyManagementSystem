import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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

const PASSWORD_RULES = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const getStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
  return score;
};

const StrengthBar = ({ score }) => {
  if (!score) return null;
  const label = score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : 'Strong';
  const color =
    score <= 1 ? 'bg-red-500' : score <= 3 ? 'bg-yellow-400' : 'bg-green-500';
  const textColor =
    score <= 1 ? 'text-red-500' : score <= 3 ? 'text-yellow-500' : 'text-green-600';
  const width = score === 1 ? 'w-1/4' : score === 2 ? 'w-2/4' : score === 3 ? 'w-3/4' : 'w-full';

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color} ${width}`} />
      </div>
      <p className={`text-xs mt-1 font-medium ${textColor}`}>{label}</p>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const passwordValue = watch('password', '');
  const strength = getStrength(passwordValue);

  // Password requirements
  const unmet = [];
  if (passwordValue && passwordValue.length < 8) unmet.push('8 characters');
  if (passwordValue && !/[A-Z]/.test(passwordValue)) unmet.push('1 uppercase');
  if (passwordValue && !/\d/.test(passwordValue)) unmet.push('1 number');
  if (passwordValue && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue)) unmet.push('1 special character');
  const unmetText = unmet.length > 0 ? `Missing: ${unmet.join(', ')}` : '';

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      await api.post('/auth/register', {
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) =>
    visible ? (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <style>{`
        body, #root, .register-bg-fixed {
          min-height: 100vh;
        }
        .register-bg-fixed {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(to right, #BFDBFE, #DBEAFE,#EFF6FF);
        }
        .dark .register-bg-fixed {
          background: linear-gradient(to right, #0B1D3A, #0F2952, #1A3A6E) !important;
        }
      `}</style>
      <div className="register-bg-fixed" aria-hidden="true" />
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white dark:bg-[#0F1E35] rounded-2xl border border-slate-200 dark:border-[#1E3358] shadow-sm px-10 py-10">
          {/* Title inside card */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">PolarisTech</h1>
            <p className="text-sm text-slate-500 dark:text-[#7B98C4] mt-1.5">Create your account</p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-6 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Account created successfully! Redirecting to login…
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                id="full_name"
                type="text"
                placeholder="John Doe"
                aria-label="Full name"
                aria-invalid={!!errors.full_name}
                className={errors.full_name ? inputError : inputBase}
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-500" role="alert">{errors.full_name.message}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                aria-label="Username"
                aria-invalid={!!errors.username}
                className={errors.username ? inputError : inputBase}
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                  pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers and underscores' }
                })}
              />
              {errors.username && <p className="mt-1 text-xs text-red-500" role="alert">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-label="Email address"
                aria-invalid={!!errors.email}
                className={errors.email ? inputError : inputBase}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500" role="alert">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                id="phone"
                type="tel"
                placeholder="+961 70 000 000"
                aria-label="Phone number"
                aria-invalid={!!errors.phone}
                className={errors.phone ? inputError : inputBase}
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500" role="alert">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-label="Password"
                  aria-invalid={!!errors.password}
                  className={`${errors.password ? inputError : inputBase} pr-11`}
                  {...register('password', {
                    required: 'Password is required',
                    validate: v => PASSWORD_RULES.test(v) || 'Password does not meet requirements'
                  })}
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              <StrengthBar score={strength} />
              {errors.password && <p className="mt-1 text-xs text-red-500" role="alert">{errors.password.message}</p>}
              {!errors.password && passwordValue && unmetText && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{unmetText}</p>
              )}
              {!errors.password && (!passwordValue || (!unmetText && strength < 4)) && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Min 8 chars, 1 uppercase, 1 number, 1 special character
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-label="Confirm password"
                  aria-invalid={!!errors.confirmPassword}
                  className={`${errors.confirmPassword ? inputError : inputBase} pr-11`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: v => v === passwordValue || 'Passwords do not match'
                  })}
                />
                <button type="button" aria-label={showConfirm ? 'Hide password' : 'Show password'} onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500" role="alert">{errors.confirmPassword.message}</p>}
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
              aria-label="Create account"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Spinner /> Creating account…</span>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;
