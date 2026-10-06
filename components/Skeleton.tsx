// Placeholder blocks shown by the route loading.tsx files while data loads.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export function CardSkeleton({ className = "h-36" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-6 h-4 w-3/4" />
    </div>
  );
}

export function LoadingPage({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <LoadingPage>
      <div className="max-w-xl">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mb-6 mt-3 h-8 w-48" />
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </LoadingPage>
  );
}
