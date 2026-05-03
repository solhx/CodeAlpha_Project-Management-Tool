// frontend/src/app/(dashboard)/profile/page.jsx
'use client';
import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUser } from '@/store/slices/authSlice';
import api from '@/lib/axios';

export default function ProfilePage() {
  const user    = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const [form,         setForm]         = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [pwForm,       setPwForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg,   setProfileMsg]   = useState('');
  const [pwMsg,        setPwMsg]        = useState('');
  const [isUpdating,   setIsUpdating]   = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
  const fileRef = useRef(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileMsg('');
    try {
      const { data } = await api.patch('/users/me', form);
      dispatch(updateUser(data.data.user));
      setProfileMsg('✅ Profile updated successfully');
    } catch (err) {
      setProfileMsg('❌ ' + (err?.response?.data?.message || 'Update failed'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await api.patch('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateUser({ avatar: data.data.avatar }));
    } catch (err) {
      console.error('Avatar upload failed', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('❌ Passwords do not match');
      return;
    }
    setIsChangingPw(true);
    setPwMsg('');
    try {
      await api.patch('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwMsg('✅ Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg('❌ ' + (err?.response?.data?.message || 'Password change failed'));
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account details</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative group">
          <img
            src={avatarPreview ||
              `https://ui-avatars.com/api/?name=${user?.name}&size=80&background=6366f1&color=fff`}
            alt={user?.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center 
                       justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm"
          >
            📷
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-indigo-600 text-sm hover:text-indigo-800 mt-1"
          >
            Change avatar
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Personal Information</h2>
        {profileMsg && (
          <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${
            profileMsg.startsWith('✅')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {profileMsg}
          </div>
        )}
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="input-field opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Tell your team about yourself..."
              className="input-field resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="btn-primary text-sm"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Change Password</h2>
        {pwMsg && (
          <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${
            pwMsg.startsWith('✅')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {pwMsg}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword',     label: 'New Password' },
            { key: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
              <input
                type="password"
                value={pwForm[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          ))}
          <button type="submit" disabled={isChangingPw} className="btn-primary text-sm">
            {isChangingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}