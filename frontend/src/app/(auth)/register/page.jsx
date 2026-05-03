// frontend/src/app/(auth)/register/page.jsx
'use client';
import { useState } from 'react';
import { useRegisterMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
      }).unwrap();
      dispatch(setCredentials({
        user: result.data.user,
        accessToken: result.data.accessToken,
      }));
      router.push('/dashboard');
    } catch (err) {
      setErrors({ general: err?.data?.message || 'Registration failed' });
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center 
                          text-white text-2xl font-bold mx-auto mb-4 shadow-lg">P</div>
          <h1 className="text-3xl font-bold text-slate-800">Create your account</h1>
          <p className="text-slate-500 mt-1">Start managing projects like a pro</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              ⚠️ {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition-all
                    focus:outline-none focus:ring-2 focus:ring-indigo-300
                    ${errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold 
                         py-3 rounded-xl transition-all mt-2 shadow-md disabled:opacity-60"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-800">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}