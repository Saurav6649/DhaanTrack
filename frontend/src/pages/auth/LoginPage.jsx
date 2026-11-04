import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { ShieldCheck, Tractor, Lock, User, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values) => {
    try {
      setServerError('');
      const user = await login(values.userId, values.password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25 mb-4">
          <img src="/logo.svg" alt="DhaanTrack" className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">DhaanTrack</h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          Harvester Work, Billing & Profit Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">
          {serverError && (
            <Alert type="error" message={serverError} className="mb-6" />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                  }`}
                />
              </div>
              {errors.userId && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.userId.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-11 pr-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                    errors.password
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
                  }`}
                />
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
              className="w-full mt-2 font-bold"
            >
              Sign In to DhaanTrack <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Role-governed secure access with audit logging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
