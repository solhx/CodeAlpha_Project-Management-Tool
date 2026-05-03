// frontend/src/components/ui/Dropdown.jsx
'use client';
import { useState, useRef, useEffect, createContext, useContext } from 'react';

const DropdownContext = createContext(null);

// ── Root ──
export function Dropdown({ children, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className={`relative inline-block ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// ── Trigger ──
export function DropdownTrigger({ children, className = '', asChild = false }) {
  const { open, setOpen } = useContext(DropdownContext);

  if (asChild) {
    return (
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="true"
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {children}
    </button>
  );
}

// ── Menu ──
const POSITIONS = {
  'bottom-left':  'top-full left-0 mt-1',
  'bottom-right': 'top-full right-0 mt-1',
  'top-left':     'bottom-full left-0 mb-1',
  'top-right':    'bottom-full right-0 mb-1',
};

export function DropdownMenu({
  children,
  position  = 'bottom-left',
  minWidth  = 'min-w-[180px]',
  className = '',
}) {
  const { open } = useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      role="menu"
      className={`
        absolute z-50 bg-white rounded-xl shadow-lg border border-slate-200
        py-1 animate-fade-in
        ${POSITIONS[position] || POSITIONS['bottom-left']}
        ${minWidth}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ── Item ──
export function DropdownItem({
  children,
  onClick,
  disabled  = false,
  danger    = false,
  icon      = null,
  shortcut  = null,
  className = '',
}) {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={`
        w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50'}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0 text-base">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

// ── Separator ──
export function DropdownSeparator({ className = '' }) {
  return <hr className={`my-1 border-slate-100 ${className}`} />;
}

// ── Label ──
export function DropdownLabel({ children, className = '' }) {
  return (
    <p className={`px-4 py-2 text-xs font-semibold text-slate-400
                   uppercase tracking-wider ${className}`}>
      {children}
    </p>
  );
}

// ── Convenience: pre-built dropdown with a button trigger ──
export function SimpleDropdown({
  label,
  items = [],
  position = 'bottom-left',
  triggerClassName = '',
  icon = '⋮',
}) {
  return (
    <Dropdown>
      <DropdownTrigger
        className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                    hover:bg-slate-100 transition-colors ${triggerClassName}`}
      >
        <span className="text-lg leading-none">{icon}</span>
        {label && <span className="text-sm font-medium">{label}</span>}
      </DropdownTrigger>

      <DropdownMenu position={position}>
        {items.map((item, i) => {
          if (item.type === 'separator') return <DropdownSeparator key={i} />;
          if (item.type === 'label')     return <DropdownLabel key={i}>{item.label}</DropdownLabel>;
          return (
            <DropdownItem
              key={i}
              onClick={item.onClick}
              disabled={item.disabled}
              danger={item.danger}
              icon={item.icon}
              shortcut={item.shortcut}
            >
              {item.label}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}

export default Dropdown;