// frontend/src/components/ui/Input.jsx
import { forwardRef, useState, useId } from 'react';

// ── Base Input ──
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    type        = 'text',
    size        = 'md',
    variant     = 'default',
    fullWidth   = true,
    required    = false,
    disabled    = false,
    className   = '',
    containerClassName = '',
    labelClassName = '',
    ...props
  },
  ref
) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const SIZES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const VARIANTS = {
    default: `border border-slate-200 bg-white focus:ring-2
              focus:ring-indigo-300 focus:border-transparent`,
    filled:  `border border-transparent bg-slate-100
              focus:bg-white focus:ring-2 focus:ring-indigo-300`,
    flushed: `border-b border-slate-300 rounded-none px-0
              focus:ring-0 focus:border-indigo-500`,
  };

  const baseClasses = `
    w-full rounded-xl outline-none transition-all duration-200
    disabled:opacity-60 disabled:cursor-not-allowed
    placeholder:text-slate-400
    ${SIZES[size]  || SIZES.md}
    ${VARIANTS[variant] || VARIANTS.default}
    ${error ? 'border-red-400 bg-red-50 focus:ring-red-300 focus:border-transparent' : ''}
    ${leftIcon  ? 'pl-10'  : ''}
    ${(rightIcon || isPassword) ? 'pr-10' : ''}
    ${className}
  `;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-semibold text-slate-700 mb-1.5 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input Wrapper */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2
                           text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={baseClasses}
          {...props}
        />

        {/* Right Icon / Password Toggle */}
        {(rightIcon || isPassword) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            ) : rightIcon}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p id={`${id}-error`} className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-slate-400 text-xs mt-1">{hint}</p>
      )}
    </div>
  );
});

export default Input;

// ── Textarea ──
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    rows        = 4,
    maxLength,
    showCount   = false,
    required    = false,
    disabled    = false,
    className   = '',
    containerClassName = '',
    value       = '',
    ...props
  },
  ref
) {
  const id = useId();

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        value={value}
        aria-invalid={!!error}
        className={`
          w-full px-4 py-3 text-sm rounded-xl border outline-none
          transition-all duration-200 resize-none
          placeholder:text-slate-400
          disabled:opacity-60 disabled:cursor-not-allowed
          ${error
            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
            : 'border-slate-200 bg-white focus:ring-2 focus:ring-indigo-300 focus:border-transparent'}
          ${className}
        `}
        {...props}
      />

      <div className="flex items-center justify-between mt-1">
        {error ? (
          <p className="text-red-500 text-xs flex items-center gap-1">⚠ {error}</p>
        ) : hint ? (
          <p className="text-slate-400 text-xs">{hint}</p>
        ) : <span />}

        {showCount && maxLength && (
          <p className={`text-xs ${
            String(value).length > maxLength * 0.9
              ? 'text-amber-500'
              : 'text-slate-400'
          }`}>
            {String(value).length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

// ── Select ──
export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    options     = [],
    placeholder = 'Select an option',
    required    = false,
    disabled    = false,
    className   = '',
    ...props
  },
  ref
) {
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={id}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-2.5 text-sm rounded-xl border outline-none
          transition-all duration-200 bg-white
          disabled:opacity-60 disabled:cursor-not-allowed
          ${error
            ? 'border-red-400 focus:ring-2 focus:ring-red-300'
            : 'border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:border-transparent'}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map(({ value, label: optLabel, disabled: optDisabled }) => (
          <option key={value} value={value} disabled={optDisabled}>
            {optLabel}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-xs mt-1">⚠ {error}</p>}
      {hint && !error && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
    </div>
  );
});

// ── Checkbox ──
export const Checkbox = forwardRef(function Checkbox(
  {
    label,
    description,
    error,
    disabled = false,
    className = '',
    ...props
  },
  ref
) {
  const id = useId();

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        disabled={disabled}
        className="w-4 h-4 mt-0.5 accent-indigo-600 rounded cursor-pointer
                   disabled:cursor-not-allowed"
        {...props}
      />
      {(label || description) && (
        <label
          htmlFor={id}
          className={`cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {label && <p className="text-sm font-medium text-slate-700">{label}</p>}
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </label>
      )}
      {error && <p className="text-red-500 text-xs mt-1">⚠ {error}</p>}
    </div>
  );
});

// ── Toggle / Switch ──
export function Toggle({
  label,
  description,
  checked  = false,
  onChange,
  disabled = false,
  size     = 'md',
}) {
  const SIZES = {
    sm: { track: 'w-8 h-4',  thumb: 'w-3 h-3',   translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5',   translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6',   translate: 'translate-x-7' },
  };
  const sz = SIZES[size] || SIZES.md;

  return (
    <label className={`flex items-center gap-3 cursor-pointer
                       ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative flex-shrink-0 ${sz.track} rounded-full transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                    ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 ${sz.thumb} bg-white rounded-full
                      shadow transition-transform duration-200
                      ${checked ? sz.translate : 'translate-x-0'}`}
        />
      </button>

      {(label || description) && (
        <div>
          {label       && <p className="text-sm font-medium text-slate-700">{label}</p>}
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}

// ── Search Input convenience ──
export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  className   = '',
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2
                       text-slate-400 pointer-events-none text-sm">
        🔍
      </span>
      <input
        type="search"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200
                   rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300
                   focus:border-transparent transition-all"
        {...props}
      />
    </div>
  );
}