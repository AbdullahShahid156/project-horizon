import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className, count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('rounded-xl border bg-card p-6 shadow-sm', className)}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${100 / cols}%` }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="border-b p-4 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <div
                key={col}
                className="h-4 animate-pulse rounded bg-muted/60"
                style={{ width: `${100 / cols}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('h-4 animate-pulse rounded bg-muted', className)} />;
}
