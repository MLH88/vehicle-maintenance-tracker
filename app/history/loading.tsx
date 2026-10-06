import { CardSkeleton, LoadingPage, Skeleton } from "@/components/Skeleton";

export default function HistoryLoading() {
  return (
    <LoadingPage>
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="space-y-4">
        <CardSkeleton className="h-24" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
        <CardSkeleton className="h-80" />
      </div>
    </LoadingPage>
  );
}
