'use client';
import { Provider }     from 'react-redux';
import { PersistGate }  from 'redux-persist/integration/react';
import { store, persistor } from '@/store';

// Shown while localStorage is being read (usually < 100ms)
// Prevents the blank flash that caused your bug
function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600
                          border-t-transparent animate-spin" />
        </div>
        {/* Brand Mark */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center
                          justify-center text-white font-bold text-sm shadow-sm">
            P
          </div>
          <span className="text-slate-700 font-semibold text-lg">ProFlow</span>
        </div>
        <p className="text-slate-400 text-sm">Loading your workspace...</p>
      </div>
    </div>
  );
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      {/*
        PersistGate delays rendering children until localStorage rehydration
        is complete. This is what prevents the blank dashboard.
        loading prop = what to show during that brief window.
      */}
      <PersistGate loading={<AppLoadingScreen />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}