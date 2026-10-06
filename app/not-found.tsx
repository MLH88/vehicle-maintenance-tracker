import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="This vehicle or record may have been deleted."
      action={
        <Link href="/" className="font-medium text-blue-600 hover:text-blue-800">
          Back to dashboard
        </Link>
      }
    />
  );
}
