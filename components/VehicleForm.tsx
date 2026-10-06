"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { Field, FormMessage, SubmitButton, secondaryButtonClass } from "@/components/forms";
import { initialFormState, type FormState } from "@/lib/form";

type VehicleValues = {
  name: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
};

export default function VehicleForm({
  action,
  vehicle,
  cancelHref,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  vehicle?: VehicleValues;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <FormMessage message={state.message} />
      <Field
        label="Name"
        name="name"
        placeholder="e.g. Daily Driver"
        defaultValue={vehicle?.name}
        error={errors.name}
        required
        maxLength={60}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make" name="make" placeholder="e.g. Honda" defaultValue={vehicle?.make} error={errors.make} required maxLength={60} />
        <Field label="Model" name="model" placeholder="e.g. Civic" defaultValue={vehicle?.model} error={errors.model} required maxLength={60} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Year"
          name="year"
          type="number"
          inputMode="numeric"
          min={1886}
          max={new Date().getFullYear() + 1}
          defaultValue={vehicle?.year}
          error={errors.year}
          required
        />
        <Field
          label="Current mileage (km)"
          name="currentMileage"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={vehicle?.currentMileage}
          error={errors.currentMileage}
          required
        />
      </div>
      <div className="flex gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
