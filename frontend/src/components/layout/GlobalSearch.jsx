// frontend/src/components/layout/GlobalSearch.jsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/axios';
import Spinner from '../ui/Spinner';

export default function GlobalSearch() {
  const [query,   setQuery  ] = useState('');
  const [results, setResults] = useState({ projects: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [open,    setOpen   ] = useState(false);
  const [error,   setError  ] = useState('');

  const router       = useRouter();
  const inputRef     = useRef(null);
  const containerRef = useRef(null);
  const debounceRef  = useRef(null);
  // ✅ Separate AbortController per request pair — avoids shared-signal issues
  const abortRef     = useRef(null);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── ⌘K / Ctrl+K shortcut ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const doSearch = useCallback(async (q) => {
    // Cancel previous in-flight pair
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    setError('');

    // ✅ FIX: Promise.allSettled instead of Promise.all
    //
    // Promise.all rejects immediately when ANY single promise rejects,
    // discarding results from the OTHER request even if it succeeded.
    //
    // Common real-world case: /projects uses MongoDB $text search which
    // requires a text index — if that index is missing, /projects returns
    // 500 but /users/search would have returned valid results. With
    // Promise.all the user sees "Search failed" instead of member results.
    //
    // Promise.allSettled always waits for ALL promises to settle, then
    // returns { status: 'fulfilled'|'rejected', value|reason } per entry.
    const [projectsResult, usersResult] = await Promise.allSettled([
      api.get('/projects',     { params: { search: q, limit: 5 }, signal }),
      api.get('/users/search', { params: { q },                   signal }),
    ]);

    // ✅ If the signal was aborted, both results will be 'rejected' with
    // a CanceledError — check BEFORE updating any state to avoid setting
    // stale results from an outdated search.
    if (signal.aborted) return;

    // ── Extract results, tolerating individual failures ──
    const projects = projectsResult.status === 'fulfilled'
      ? projectsResult.value.data?.data?.projects || []
      : [];

    const users = usersResult.status === 'fulfilled'
      ? usersResult.value.data?.data?.users || []
      : [];

    // ── Surface errors only if BOTH failed ──
    // If one succeeded, show whatever we got — partial results > no results.
    const bothFailed =
      projectsResult.status === 'rejected' &&
      usersResult.status    === 'rejected';

    if (bothFailed) {
      // ✅ Skip cancel errors — these are intentional, not real failures
      const realError = [projectsResult.reason, usersResult.reason].find(
        (err) => !axios.isCancel(err) && err?.code !== 'ERR_CANCELED'
      );

      if (realError) {
        // Log actual error details for debugging (visible in DevTools console)
        console.error('Search failed:', {
          projects: projectsResult.reason?.response?.data || projectsResult.reason?.message,
          users   : usersResult.reason?.response?.data    || usersResult.reason?.message,
        });
        setError('Search failed. Please try again.');
        setResults({ projects: [], users: [] });
        setLoading(false);
        return;
      }
      // Both rejected but only cancel errors → was aborted, just return
      return;
    }

    setResults({ projects, users });
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    setError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length >= 2) {
      setLoading(true);
      debounceRef.current = setTimeout(() => doSearch(val), 350);
    } else {
      setLoading(false);
      setResults({ projects: [], users: [] });
      abortRef.current?.abort();
    }
  };

  const handleSelect = (href) => {
    setOpen(false);
    setQuery('');
    setResults({ projects: [], users: [] });
    router.push(href);
  };

  const hasResults = results.projects.length > 0 || results.users.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">

      {/* ── Input ── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search projects, members..."
          className="w-full pl-9 pr-12 py-2 text-sm bg-slate-50 border border-slate-200
                     rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300
                     focus:border-transparent transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400
                        bg-slate-200 rounded px-1.5 py-0.5 hidden sm:block">
          ⌘K
        </kbd>
      </div>

      {/* ── Dropdown ── */}
      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl
                        shadow-xl border border-slate-200 z-50 overflow-hidden
                        max-h-96 overflow-y-auto">

          {/* Error — only shown when BOTH endpoints fail */}
          {error && !loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-500
                            bg-red-50 border-b border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
              <Spinner size="sm" /> Searching...
            </div>
          )}

          {/* Empty */}
          {!loading && !hasResults && !error && (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* ── Projects ── */}
          {results.projects.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase
                            tracking-wider bg-slate-50 border-b border-slate-100">
                Projects
              </p>
              {results.projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => handleSelect(`/projects/${project._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50
                             transition-colors text-left"
                >
                  <span className="text-xl">{project.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {project.description}
                    </p>
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* ── Members ── */}
          {results.users.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase
                            tracking-wider bg-slate-50 border-b border-slate-100">
                Members
              </p>
              {results.users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50
                             transition-colors cursor-default"
                >
                  <img
                    src={
                      user.avatar?.url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=32`
                    }
                    className="w-8 h-8 rounded-full"
                    alt={user.name}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}