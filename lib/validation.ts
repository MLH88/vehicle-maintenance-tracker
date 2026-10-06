import type { FieldErrors } from "@/lib/form";
import { fromDateInputValue, todayInputValue } from "@/lib/dates";

type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(
  formData: FormData,
  key: string,
  label: string,
  maxLength: number,
  errors: FieldErrors,
): string {
  const value = text(formData, key);
  if (!value) errors[key] = `${label} is required.`;
  else if (value.length > maxLength) errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  return value;
}

function optionalText(
  formData: FormData,
  key: string,
  label: string,
  maxLength: number,
  errors: FieldErrors,
): string | null {
  const value = text(formData, key);
  if (value.length > maxLength) errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  return value || null;
}

function requiredNumber(
  formData: FormData,
  key: string,
  label: string,
  errors: FieldErrors,
  { integer = false, min, max }: { integer?: boolean; min?: number; max?: number } = {},
): number {
  // Allow thousands separators like "84,250".
  const raw = text(formData, key).replace(/,/g, "");
  if (!raw) {
    errors[key] = `${label} is required.`;
    return NaN;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) errors[key] = `${label} must be a number.`;
  else if (integer && !Number.isInteger(value)) errors[key] = `${label} must be a whole number.`;
  else if (min !== undefined && value < min) errors[key] = `${label} must be at least ${min}.`;
  else if (max !== undefined && value > max) errors[key] = `${label} must be at most ${max}.`;
  return value;
}

export type VehicleInput = {
  name: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
};

export function parseVehicleForm(formData: FormData): Result<VehicleInput> {
  const errors: FieldErrors = {};
  const data = {
    name: requiredText(formData, "name", "Name", 60, errors),
    make: requiredText(formData, "make", "Make", 60, errors),
    model: requiredText(formData, "model", "Model", 60, errors),
    year: requiredNumber(formData, "year", "Year", errors, {
      integer: true,
      min: 1886,
      max: new Date().getFullYear() + 1,
    }),
    currentMileage: requiredNumber(formData, "currentMileage", "Mileage", errors, {
      integer: true,
      min: 0,
    }),
  };
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export type RecordInput = {
  serviceType: string;
  date: Date;
  mileage: number;
  cost: number;
  shopName: string | null;
  notes: string | null;
};

export function parseRecordForm(formData: FormData): Result<RecordInput> {
  const errors: FieldErrors = {};

  const dateValue = text(formData, "date");
  const date = fromDateInputValue(dateValue);
  if (!dateValue) errors.date = "Date is required.";
  else if (!date) errors.date = "Enter a valid date.";
  // YYYY-MM-DD strings compare correctly as plain strings.
  else if (dateValue > todayInputValue()) errors.date = "Date can't be in the future.";

  const cost = requiredNumber(formData, "cost", "Cost", errors, { min: 0 });

  const data = {
    serviceType: requiredText(formData, "serviceType", "Service type", 100, errors),
    date: date as Date,
    mileage: requiredNumber(formData, "mileage", "Mileage", errors, { integer: true, min: 0 }),
    cost: Math.round(cost * 100) / 100,
    shopName: optionalText(formData, "shopName", "Shop name", 100, errors),
    notes: optionalText(formData, "notes", "Notes", 1000, errors),
  };
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export type ReminderInput = {
  serviceType: string;
  intervalKm: number | null;
  intervalMonths: number | null;
};

function optionalInteger(
  formData: FormData,
  key: string,
  label: string,
  errors: FieldErrors,
  { min, max }: { min: number; max: number },
): number | null {
  if (!text(formData, key)) return null;
  return requiredNumber(formData, key, label, errors, { integer: true, min, max });
}

export function parseReminderForm(formData: FormData): Result<ReminderInput> {
  const errors: FieldErrors = {};
  const data = {
    serviceType: requiredText(formData, "serviceType", "Service type", 100, errors),
    intervalKm: optionalInteger(formData, "intervalKm", "Distance interval", errors, { min: 1, max: 1_000_000 }),
    intervalMonths: optionalInteger(formData, "intervalMonths", "Time interval", errors, { min: 1, max: 240 }),
  };
  if (!errors.intervalKm && !errors.intervalMonths && data.intervalKm === null && data.intervalMonths === null) {
    errors.intervalKm = "Set a distance interval, a time interval, or both.";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
