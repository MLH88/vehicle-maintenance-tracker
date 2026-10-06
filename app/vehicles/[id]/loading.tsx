import { CardSkeleton, LoadingPage, Skeleton } from "@/components/Skeleton";

export default function VehicleLoading() {
  return (
    <LoadingPage>
      <div className="space-y-10">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-52" />
          <CardSkeleton className="h-64" />
        </div>
      </div>
    </LoadingPage>
  );
}
