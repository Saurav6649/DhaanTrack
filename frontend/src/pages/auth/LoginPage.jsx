import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Priority 1: If session verification is in progress, show dedicated loader to prevent login flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-950">
        <LoadingSpinner label="Checking session..." size="lg" />
      </div>
    );
  }

  // Priority 1: If user is already authenticated with valid session, redirect to /dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    try {
      setServerError('');
      const user = await login(values.userId, values.password);
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none">
      {/* Full-Screen Agricultural Landscape Background (Lush Farmland + Tractor + Harvester in Golden Sunlight) */}
      <div className="absolute inset-0 overflow-hidden -z-20">
        <img
          src="/login-bg.jpg"
          alt="Lush green farmland with modern tractor and combine harvester in sunlight"
          id="login-bg-image"
          className="w-full h-full object-cover object-center login-bg-zoom scale-105"
          loading="eager"
        />
      </div>

      {/* Deep Emerald & Dark Green Gradient Overlay for High Contrast & Card Readability */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/90 via-brand-950/75 to-emerald-950/80 -z-10 backdrop-blur-[1px]" />

      {/* Subtle Green Ambient Glow behind Card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Centered Login Card */}
      <div className="relative w-full max-w-md login-card-anim my-auto">
        <div className="bg-white/95 sm:bg-white/92 backdrop-blur-xl py-9 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-black/50 border border-white/60">
          {/* App Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-3.5">
              <img src="/logo.svg" alt="DhaanTrack" className="w-11 h-11 object-contain" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">DhaanTrack</h2>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                AgTech
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 font-medium">
              Harvester Work, Billing & Profit Management System
            </p>
          </div>

          {serverError && (
            <Alert type="error" message={serverError} className="mb-6" />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                User ID
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. admin or operator1"
                  {...register('userId')}
                  className={`block w-full pl-11 pr-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                    errors.userId
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200 bg-gray-50/60 hover:border-gray-300'
                  }`}
                />
              </div>
              {errors.userId && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.userId.message}</p>
              )}
            </div>

            {/* Password Field with Eye Visibility Toggle Button */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-11 pr-11 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                    errors.password
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200 bg-gray-50/60 hover:border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  id="toggle-password-visibility-btn"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-brand-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full mt-2 font-bold shadow-lg shadow-brand-600/30 hover:shadow-brand-600/40"
            >
              Sign In to DhaanTrack <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Info Box & Navigation */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Role-governed secure access with audit logging</span>
            </div>
            <Link
              to="/"
              className="text-xs text-gray-500 hover:text-brand-700 font-semibold inline-block transition-colors"
            >
              ← Back to DhaanTrack Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
