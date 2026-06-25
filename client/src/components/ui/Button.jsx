import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-border hover:bg-slate-50 focus:ring-primary-500',
  danger:    'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-sm',
  success:   'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-sm',
  warning:   'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-sm',
  ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-primary-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
