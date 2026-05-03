// frontend/src/lib/utils.js

// Format date
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
    ...options,
  });
};

// Time ago
export const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Truncate text
export const truncate = (str, maxLen = 60) =>
  str?.length > maxLen ? str.slice(0, maxLen) + '...' : str;

// Generate random hex color
export const randomColor = () => {
  const colors = [
    '#6366f1','#8b5cf6','#ec4899','#ef4444',
    '#f97316','#eab308','#22c55e','#14b8a6',
    '#3b82f6','#06b6d4',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Check if date is overdue
export const isOverdue = (dueDate, status) =>
  dueDate && new Date(dueDate) < new Date() && status !== 'done';

// Get initials from name
export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

// Priority sort order
export const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };

// Debounce
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Deep clone
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Flatten array of objects by key
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// Task completion percentage
export const checklistProgress = (checklist = []) => {
  if (!checklist.length) return 0;
  return Math.round(
    (checklist.filter((c) => c.isCompleted).length / checklist.length) * 100
  );
};

// Generate avatar fallback URL
export const avatarUrl = (name, size = 32) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=6366f1&color=fff`;

// Status label map
export const STATUS_LABELS = {
  todo:        'To Do',
  in_progress: 'In Progress',
  review:      'Review',
  done:        'Done',
};

// Priority config
export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-600',    bg: 'bg-red-50',    icon: '🔴' },
  high:     { label: 'High',     color: 'text-orange-600', bg: 'bg-orange-50', icon: '🟠' },
  medium:   { label: 'Medium',   color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '🟡' },
  low:      { label: 'Low',      color: 'text-green-600',  bg: 'bg-green-50',  icon: '🟢' },
  none:     { label: 'None',     color: 'text-gray-400',   bg: 'bg-gray-50',   icon: '⚪' },
};