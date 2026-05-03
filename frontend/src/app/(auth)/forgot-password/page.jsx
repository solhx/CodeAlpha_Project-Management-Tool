// frontend/src/app/(auth)/forgot-password/page.jsx
'use client';
import { useState } from 'react';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [message,   setMessage]   = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await forgotPassword({ email }).unwrap();
      setMessage(result.message);
      setIsSuccess(true);
    } catch (err) {
      setMessage(err?.data?.message || 'Something went wrong');
      setIsSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center 
                          text-white text-2xl font-bold mx-auto mb-4">P</div>
          <h1 className="text-3xl font-bold text-slate-800">Forgot Password?</h1>
          <p className="text-slate-500 mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {message && (
            <div className={`text-sm px-4 py-3 rounded-xl mb-6 ${
              isSuccess
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {isSuccess ? '✅' : '⚠️'} {message}
            </div>
          )}

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">📬</p>
              <p className="text-slate-600 text-sm">Check your inbox for the reset link.</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-800">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
