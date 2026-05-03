// frontend/src/components/layout/DashboardLayout.jsx
'use client';
import Sidebar  from './Sidebar';
import Navbar   from './Navbar';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsAuthenticated,
  setCredentials,
  logout,
} from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600
                          border-t-transparent animate-spin" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center
                          justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="text-slate-700 font-semibold text-lg">ProFlow</span>
        </div>
        <p className="text-slate-400 text-sm">Loading your workspace...</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch        = useDispatch();
  const router          = useRouter();
  useSocket();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setIsInitializing(false);
      return;
    }

    const tryRefresh = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          {
            method     : 'POST',
            credentials: 'include',
            headers    : { 'Content-Type': 'application/json' },
          }
        );

        if (res.ok) {
          const json = await res.json();
          dispatch(setCredentials({
            user       : json.data?.user,
            accessToken: json.data?.accessToken,
          }));
        } else {
          dispatch(logout());
          router.replace('/login');
        }
      } catch {
        dispatch(logout());
        router.replace('/login');
      } finally {
        setIsInitializing(false);
      }
    };

    tryRefresh();
  }, []);

  if (isInitializing)   return <LoadingScreen />;
  if (!isAuthenticated) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/*
       * ✅ FIX 1: Added `overflow-hidden` to this wrapper.
       *
       * WHY: The Sidebar is `fixed` (out of normal flow). Without overflow-hidden,
       * when Kanban columns overflow the page width, the browser allows horizontal
       * scrolling of the ENTIRE page. When that happens, the `sticky` Navbar scrolls
       * with the page but the `fixed` Sidebar stays put — causing visual overlap.
       *
       * `overflow-hidden` here clips page-level overflow, while `<main>`'s own
       * `overflow-auto` still lets the KanbanBoard scroll horizontally inside it.
       */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}