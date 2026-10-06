"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Field, FormMessage, ServiceTypeInput, SubmitButton, secondaryButtonClass } from "@/components/forms";
import { initialFormState, type FormState } from "@/lib/form";

type ReminderValues = {
  serviceType: string;
  intervalKm: number | null;
  intervalMonths: number | null;
};

export default function ReminderForm({
  action,
  reminder,
  suggestions,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  reminder?: ReminderValues;
  suggestions: string[];
  submitLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useFormState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-4">
      <FormMessage message={state.message} />
      {state.ok && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Reminder added.
        </p>
      )}

      <ServiceTypeInput
        id="reminder-serviceType"
        defaultValue={reminder?.serviceType}
        suggestions={suggestions}
        error={errors.serviceType}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="reminder-intervalKm"
          label="Every … km"
          name="intervalKm"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="e.g. 8000"
          defaultValue={reminder?.intervalKm ?? undefined}
          error={errors.intervalKm}
          hint="Optional"
        />
        <Field
          id="reminder-intervalMonths"
          label="Every … months"
          name="intervalMonths"
          type="number"
          inputMode="numeric"
          min={1}
          max={240}
          step={1}
          placeholder="e.g. 6"
          defaultValue={reminder?.intervalMonths ?? undefined}
          error={errors.intervalMonths}
          hint="Optional"
        />
      </div>
      <p className="text-xs text-slate-500">
        Set one or both. With both, the service is due at whichever comes first.
      </p>

      <div className="flex flex-wrap gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        {cancelHref && (
          <Link href={cancelHref} className={secondaryButtonClass}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
