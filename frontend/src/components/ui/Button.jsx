// frontend/src/components/ui/Button.jsx
import { forwardRef } from 'react';
import Spinner        from './Spinner';

const VARIANTS = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300',
  danger:    'bg-red-500 hover:bg-red-600 text-white',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600',
  success:   'bg-green-600 hover:bg-green-700 text-white',
  warning:   'bg-amber-500 hover:bg-amber-600 text-white',
  outline:   'bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
};

const SIZES = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg',
  sm: 'text-sm px-3.5 py-2 rounded-xl',
  md: 'text-sm px-5 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
  xl: 'text-lg px-8 py-3.5 rounded-2xl',
};

const Button = forwardRef(function Button(
  {
    children,
    variant    = 'primary',
    size       = 'md',
    isLoading  = false,
    disabled   = false,
    fullWidth  = false,
    leftIcon   = null,
    rightIcon  = null,
    loadingText = 'Loading...',
    className  = '',
    type       = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size]       || SIZES.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {leftIcon  && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

export default Button;