import { addMonths, daysBetween } from "@/lib/dates";
import { canonicalServiceType } from "@/lib/serviceTypes";

export const DUE_SOON_KM = 1000;
export const DUE_SOON_DAYS = 30;

export type ReminderStatus = "overdue" | "due-soon" | "ok" | "no-history";

type ReminderLike = {
  id: number;
  serviceType: string;
  intervalKm: number | null;
  intervalMonths: number | null;
};
type RecordLike = { serviceType: string; date: Date; mileage: number };

export type ReminderState = {
  status: ReminderStatus;
  lastService?: { date: Date; mileage: number };
  // Present for whichever intervals the reminder defines.
  byKm?: { dueAt: number; remaining: number; status: Exclude<ReminderStatus, "no-history"> };
  byTime?: { dueOn: Date; remainingDays: number; status: Exclude<ReminderStatus, "no-history"> };
};

const SEVERITY: Record<ReminderStatus, number> = { overdue: 0, "due-soon": 1, "no-history": 2, ok: 3 };

export function compareStatus(a: ReminderStatus, b: ReminderStatus): number {
  return SEVERITY[a] - SEVERITY[b];
}

function statusFor(remaining: number, soonThreshold: number) {
  if (remaining < 0) return "overdue" as const;
  if (remaining <= soonThreshold) return "due-soon" as const;
  return "ok" as const;
}

// A reminder is due when either interval runs out, whichever comes first, counted
// from the most recent record with the same service type (case-insensitive, so
// "Oil Change" matches an "Oil change" reminder).
export function reminderState(
  reminder: ReminderLike,
  records: RecordLike[],
  currentMileage: number,
  today = new Date(),
): ReminderState {
  const type = canonicalServiceType(reminder.serviceType).toLowerCase();
  const matching = records.filter((r) => canonicalServiceType(r.serviceType).toLowerCase() === type);
  if (matching.length === 0) return { status: "no-history" };

  const last = matching.reduce((a, b) =>
    b.date > a.date || (b.date.getTime() === a.date.getTime() && b.mileage > a.mileage) ? b : a,
  );

  // If the odometer on the vehicle wasn't updated, a newer record may show a
  // higher reading; trust whichever is higher.
  const mileageNow = Math.max(currentMileage, ...records.map((r) => r.mileage));

  const state: ReminderState = { status: "ok", lastService: { date: last.date, mileage: last.mileage } };

  if (reminder.intervalKm) {
    const dueAt = last.mileage + reminder.intervalKm;
    const remaining = dueAt - mileageNow;
    state.byKm = { dueAt, remaining, status: statusFor(remaining, DUE_SOON_KM) };
  }
  if (reminder.intervalMonths) {
    const dueOn = addMonths(last.date, reminder.intervalMonths);
    const remainingDays = daysBetween(today, dueOn);
    state.byTime = { dueOn, remainingDays, status: statusFor(remainingDays, DUE_SOON_DAYS) };
  }

  const statuses = [state.byKm?.status, state.byTime?.status].filter(Boolean) as ReminderStatus[];
  state.status = statuses.sort(compareStatus)[0] ?? "ok";
  return state;
}
