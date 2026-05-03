// frontend/src/app/(auth)/reset-password/[token]/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';

export default function ResetPasswordPage({ params }) {
  const { token } = params;
  const router    = useRouter();
  const [form,      setForm]      = useState({ newPassword: '', confirmPassword: '' });
  const [message,   setMessage]   = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(`/auth/reset-password/${token}`, { newPassword: form.newPassword });
      setIsSuccess(true);
      setMessage('Password reset successfully!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Reset failed. Token may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center 
                          text-white text-2xl font-bold mx-auto mb-4">P</div>
          <h1 className="text-3xl font-bold text-slate-800">Set New Password</h1>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'newPassword',     label: 'New Password',     placeholder: '••••••••' },
              { key: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <input
                  type="password"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="input-field"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="btn-primary w-full"
            >
              {isLoading ? 'Resetting...' : isSuccess ? 'Redirecting...' : 'Reset Password'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-800">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}