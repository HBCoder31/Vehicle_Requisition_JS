/**
 * DashboardSkeleton — Premium shimmer loading placeholder.
 * Shows 4 skeleton stats cards and 5 skeleton table rows that shimmer.
 * 
 * Props:
 *   cards  — number of stat cards to show  (default 4)
 *   rows   — number of table rows to show  (default 5)
 *   cols   — columns per table row          (default 6)
 */
export default function DashboardSkeleton({ cards = 4, rows = 5, cols = 6 }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>

      {/* Stats Cards skeleton */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cards} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="bg-surface rounded-xl border border-border shadow-sm p-4 sm:p-6 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-6 w-16 mb-1.5" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="skeleton h-5 w-40" />
        </div>
        {/* Table rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="px-6 py-3.5 flex items-center gap-6 animate-fade-in-up"
              style={{ animationDelay: `${(cards * 80) + (rowIdx * 60)}ms` }}
            >
              {Array.from({ length: cols }).map((_, colIdx) => {
                // Vary widths for a realistic look
                const widths = ['w-12', 'w-28', 'w-20', 'w-24', 'w-16', 'w-20'];
                return (
                  <div
                    key={colIdx}
                    className={`skeleton h-4 ${widths[colIdx % widths.length]} rounded`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
