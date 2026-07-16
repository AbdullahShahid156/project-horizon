import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/60 to-muted',
        className,
      )}
      style={{
        backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.6) 50%, hsl(var(--muted)) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s linear infinite',
      }}
      {...props}
    />
  );
}

export { Skeleton };
