// frontend/src/components/ui/Tooltip.jsx
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const POSITIONS = {
  top:    {
    tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow:   'top-full left-1/2 -translate-x-1/2 border-t-slate-800',
  },
  bottom: {
    tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow:   'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800',
  },
  left:   {
    tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow:   'left-full top-1/2 -translate-y-1/2 border-l-slate-800',
  },
  right:  {
    tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow:   'right-full top-1/2 -translate-y-1/2 border-r-slate-800',
  },
};

export default function Tooltip({
  children,
  content,
  position   = 'top',
  delay      = 300,
  disabled   = false,
  maxWidth   = 'max-w-xs',
  className  = '',
}) {
  const [visible, setVisible] = useState(false);
  const timerRef              = useRef(null);
  const pos                   = POSITIONS[position] || POSITIONS.top;

  const show = useCallback(() => {
    if (disabled || !content) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, content, delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!content || disabled) return <>{children}</>;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={`
            absolute z-50 pointer-events-none
            ${pos.tooltip}
          `}
        >
          {/* Tooltip Box */}
          <div
            className={`
              bg-slate-800 text-white text-xs font-medium
              px-3 py-2 rounded-lg shadow-xl leading-relaxed
              whitespace-pre-wrap break-words
              animate-fade-in
              ${maxWidth}
              ${className}
            `}
          >
            {content}
          </div>

          {/* Arrow */}
          <span
            className={`
              absolute w-0 h-0
              border-4 border-transparent
              ${pos.arrow}
            `}
          />
        </div>
      )}
    </div>
  );
}

// ── Icon Tooltip (wraps any element with a tooltip) ──
export function TooltipIcon({ icon, content, position = 'top' }) {
  return (
    <Tooltip content={content} position={position}>
      <span className="cursor-help text-slate-400 hover:text-slate-600 transition-colors">
        {icon || 'ℹ️'}
      </span>
    </Tooltip>
  );
}

// ── Truncated text with tooltip ──
export function TruncatedTooltip({
  text,
  maxChars = 30,
  position = 'top',
  className = '',
}) {
  const isTruncated = text?.length > maxChars;
  const display     = isTruncated ? `${text.slice(0, maxChars)}...` : text;

  return (
    <Tooltip content={isTruncated ? text : null} position={position}>
      <span className={className}>{display}</span>
    </Tooltip>
  );
}