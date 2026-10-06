"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/forms";

// Two-step delete: the first click asks for confirmation, the second submits
// the server action.
export default function ConfirmDeleteButton({
  action,
  label = "Delete",
  prompt,
}: {
  action: () => Promise<void>;
  label?: string;
  prompt: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2" role="alertdialog" aria-label={prompt}>
      <span className="text-sm text-slate-700">{prompt}</span>
      <SubmitButton variant="danger" pendingText="Deleting…">
        Yes, delete
      </SubmitButton>
      <button
        type="button"
        autoFocus
        onClick={() => setConfirming(false)}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Cancel
      </button>
    </form>
  );
}
