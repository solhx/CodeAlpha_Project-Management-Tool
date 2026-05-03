// frontend/src/app/(auth)/login/page.jsx
'use client';
import { useState } from 'react';
import { useLoginMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials({
        user: result.data.user,
        accessToken: result.data.accessToken,
      }));
      router.push('/dashboard');
    } catch (err) {
      setErrors({ general: err?.data?.message || 'Login failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center 
                          text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
            P
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to your ProFlow account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 
                            rounded-xl text-sm mb-6 flex items-center gap-2">
              ⚠️ {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border rounded-xl text-sm transition-all
                  focus:outline-none focus:ring-2 focus:ring-indigo-300
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition-all
                    focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-12
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="accent-indigo-600 w-4 h-4" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold 
                         py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white 
                                   rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-600 font-semibold hover:text-indigo-800">
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  );
}