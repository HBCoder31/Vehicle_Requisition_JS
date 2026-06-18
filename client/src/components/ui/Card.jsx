export default function Card({ children, className = '', header, footer, noPadding = false }) {
  return (
    <div className={`bg-surface rounded-xl border border-border shadow-sm ${className}`}>
      {header && (
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          {typeof header === 'string' ? (
            <h3 className="text-base font-semibold text-slate-800">{header}</h3>
          ) : header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>{children}</div>
      {footer && (
        <div className="px-4 sm:px-6 py-4 border-t border-border bg-slate-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
