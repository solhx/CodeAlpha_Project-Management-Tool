//frontend/src/components/layout/Navbar.jsx
'use client';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, logout } from '@/store/slices/authSlice';
import { useLogoutMutation }         from '@/store/api/authApi';
import { useRouter }                 from 'next/navigation';
import { useState }                  from 'react';
import Link                          from 'next/link';
import NotificationBell              from '../notifications/NotificationBell';
// ✅ FIX: Replace plain <input> with the fully-featured GlobalSearch component
import GlobalSearch                  from './GlobalSearch';
import { authApi }                   from '@/store/api/authApi';
import { projectApi }                from '@/store/api/projectApi';
import { boardApi }                  from '@/store/api/boardApi';
import { taskApi }                   from '@/store/api/taskApi';
import { commentApi }                from '@/store/api/commentApi';
import { notificationApi }           from '@/store/api/notificationApi';

export default function Navbar() {
  const user     = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const router   = useRouter();
  const [logoutApi]                   = useLogoutMutation();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Still clear local state even if API call fails
    } finally {
      dispatch(logout());
      dispatch(projectApi.util.resetApiState());
      dispatch(boardApi.util.resetApiState());
      dispatch(taskApi.util.resetApiState());
      dispatch(commentApi.util.resetApiState());
      dispatch(notificationApi.util.resetApiState());
      dispatch(authApi.util.resetApiState());
      router.push('/login');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center 
                       justify-between px-6 sticky top-0 z-30 shadow-sm">

      {/* ✅ FIX: GlobalSearch replaces the broken plain input
               Features: debounced API search, keyboard shortcut ⌘K,
               dropdown results for projects + members, outside-click close */}
      <GlobalSearch />

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg 
                       hover:bg-slate-100 transition-colors"
          >
            <img
              src={
                user?.avatar?.url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`
              }
              alt={user?.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-slate-700 hidden md:block">
              {user?.name}
            </span>
            <span className="text-slate-400 text-xs">▼</span>
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl 
                              shadow-lg border border-slate-200 py-1 z-50">
                <Link
                  href="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm 
                             text-slate-700 hover:bg-slate-50"
                >
                  👤 Profile
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm 
                             text-slate-700 hover:bg-slate-50"
                >
                  ⚙️ Settings
                </Link>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm 
                             text-red-600 hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}