const statusConfig = {
  'Pending_HOD':      { label: 'Pending HOD',      bg: 'bg-warning-50',  text: 'text-warning-600', dot: 'bg-warning-500' },
  'Approved_HOD':     { label: 'HOD Approved',      bg: 'bg-success-50',  text: 'text-success-700', dot: 'bg-success-500' },
  'Rejected_HOD':     { label: 'HOD Rejected',      bg: 'bg-danger-50',   text: 'text-danger-700',  dot: 'bg-danger-500' },
  'Pending_GM_HR':    { label: 'Pending GM-HR',     bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  'Approved_GM_HR':   { label: 'GM-HR Approved',    bg: 'bg-success-50',  text: 'text-success-700', dot: 'bg-success-500' },
  'Rejected_GM_HR':   { label: 'GM-HR Rejected',    bg: 'bg-danger-50',   text: 'text-danger-700',  dot: 'bg-danger-500' },
  'Pending_COO':      { label: 'Pending COO',       bg: 'bg-info-50',     text: 'text-primary-700', dot: 'bg-primary-500' },
  'Approved_COO':     { label: 'COO Approved',      bg: 'bg-success-50',  text: 'text-success-700', dot: 'bg-success-500' },
  'Rejected_COO':     { label: 'COO Rejected',      bg: 'bg-danger-50',   text: 'text-danger-700',  dot: 'bg-danger-500' },
  'Pending_Admin':    { label: 'Pending Admin',     bg: 'bg-warning-50',  text: 'text-warning-600', dot: 'bg-warning-500' },
  'Vehicle_Assigned': { label: 'Vehicle Assigned',  bg: 'bg-primary-50',  text: 'text-primary-700', dot: 'bg-primary-500' },
  'In_Transit':       { label: 'In Transit',        bg: 'bg-warning-50',  text: 'text-warning-600', dot: 'bg-warning-500' },
  'Completed':        { label: 'Completed',         bg: 'bg-success-50',  text: 'text-success-700', dot: 'bg-success-500' },
  'Cancelled':        { label: 'Cancelled',         bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
  'Deleted':          { label: 'Deleted',           bg: 'bg-danger-50',   text: 'text-danger-700',  dot: 'bg-danger-500' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
