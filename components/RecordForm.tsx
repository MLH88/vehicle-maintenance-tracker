"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import {
  Field,
  FieldHint,
  FormMessage,
  ServiceTypeInput,
  SubmitButton,
  inputClass,
  secondaryButtonClass,
} from "@/components/forms";
import { initialFormState, type FormState } from "@/lib/form";

type RecordValues = {
  serviceType: string;
  date: string; // YYYY-MM-DD
  mileage: number;
  cost: number;
  shopName: string | null;
  notes: string | null;
};

export default function RecordForm({
  action,
  record,
  suggestions,
  today,
  defaultMileage,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  record?: RecordValues;
  suggestions: string[];
  today: string; // YYYY-MM-DD, from the server so the limit matches validation
  defaultMileage?: number;
  submitLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useFormState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  // Clear the "add" form after a successful save so it's ready for the next record.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-4">
      <FormMessage message={state.message} />
      {state.ok && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Record added.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ServiceTypeInput
          id="record-serviceType"
          defaultValue={record?.serviceType}
          suggestions={suggestions}
          error={errors.serviceType}
        />
        <Field
          id="record-date"
          label="Date"
          name="date"
          type="date"
          max={today}
          defaultValue={record?.date ?? today}
          error={errors.date}
          required
        />
        <Field
          id="record-mileage"
          label="Mileage (km)"
          name="mileage"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={record?.mileage ?? defaultMileage}
          error={errors.mileage}
          required
        />
        <Field
          id="record-cost"
          label="Cost ($)"
          name="cost"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          defaultValue={record?.cost}
          error={errors.cost}
          required
        />
        <Field
          id="record-shopName"
          label="Shop name (optional)"
          name="shopName"
          defaultValue={record?.shopName ?? undefined}
          error={errors.shopName}
          maxLength={100}
          className="sm:col-span-2"
        />
      </div>

      <div>
        <label htmlFor="record-notes" className="mb-1 block text-sm font-medium text-slate-700">
          Notes (optional)
        </label>
        <textarea
          id="record-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={record?.notes ?? undefined}
          className={inputClass}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? "record-notes-error" : undefined}
        />
        <FieldHint id="record-notes" error={errors.notes} />
      </div>

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
