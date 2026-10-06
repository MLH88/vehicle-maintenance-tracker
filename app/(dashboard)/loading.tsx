import { CardSkeleton, LoadingPage, Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <LoadingPage>
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <CardSkeleton className="h-80 lg:col-span-3" />
          <CardSkeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    </LoadingPage>
  );
}
