"use client";

import EmptyState from "@/components/EmptyState";
import { secondaryButtonClass } from "@/components/forms";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description="The page couldn't be loaded. Try again, and if it keeps happening check the server logs."
      action={
        <button type="button" onClick={reset} className={secondaryButtonClass}>
          Try again
        </button>
      }
    />
  );
}
