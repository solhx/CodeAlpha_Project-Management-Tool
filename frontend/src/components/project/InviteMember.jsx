// frontend/src/components/project/InviteMember.jsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useInviteMemberMutation }      from '@/store/api/projectApi';
import api                              from '@/lib/axios';
import { debounce }                     from '@/lib/utils';

const ROLES = [
  { value: 'admin',  label: 'Admin',  desc: 'Can manage project settings and members' },
  { value: 'member', label: 'Member', desc: 'Can create and manage tasks'              },
  { value: 'viewer', label: 'Viewer', desc: 'Can view only'                            },
];

export default function InviteMember({ projectId, onSuccess }) {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [role,        setRole]        = useState('member');
  const [searching,   setSearching]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [inviteMember, { isLoading }] = useInviteMemberMutation();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchUsers = debounce(async (q) => {
    if (q.length < 2) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    try {
      const { data } = await api.get('/users/search', { params: { q } });
      setSuggestions(data.data?.users || []);
    } catch { setSuggestions([]); }
    finally  { setSearching(false); }
  }, 300);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    setError('');
    searchUsers(val);
  };

  const handleSelect = (user) => {
    setSelected(user);
    setQuery(user.name);
    setSuggestions([]);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const email = selected?.email || query;
    if (!email.includes('@')) {
      setError('Please select a valid user or enter an email');
      return;
    }

    try {
      await inviteMember({ projectId, email, role }).unwrap();
      setSuccess(`✅ ${selected?.name || email} invited as ${role}`);
      setQuery('');
      setSelected(null);
      onSuccess?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to invite member');
    }
  };

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      {error   && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{error}</div>}
      {success && <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">{success}</div>}

      {/* User Search */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Search by name or enter email
        </label>
        <div className="relative">
          <input
            value={query}
            onChange={handleQueryChange}
            placeholder="Name or email..."
            className="input-field pr-10"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}
          {selected && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200
                          rounded-xl shadow-lg z-20 overflow-hidden">
            {suggestions.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50
                           transition-colors text-left"
              >
                <img
                  src={
                    user.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${user.name}&size=32`
                  }
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  alt={user.name}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
        <div className="space-y-2">
          {ROLES.map(({ value, label, desc }) => (
            <label
              key={value}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer
                         transition-all ${
                           role === value
                             ? 'border-indigo-400 bg-indigo-50'
                             : 'border-slate-200 hover:border-slate-300'
                         }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="mt-0.5 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={(!query.trim()) || isLoading}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Inviting...' : '🤝 Send Invitation'}
      </button>
    </form>
  );
}