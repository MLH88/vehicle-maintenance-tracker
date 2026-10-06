import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatKm, plural } from "@/lib/format";
import type { ReminderState, ReminderStatus } from "@/lib/reminders";

type Reminder = { serviceType: string; intervalKm: number | null; intervalMonths: number | null };

export function describeInterval({ intervalKm, intervalMonths }: Reminder): string {
  const parts = [intervalKm ? formatKm(intervalKm) : null, intervalMonths ? plural(intervalMonths, "month") : null];
  return `Every ${parts.filter(Boolean).join(" or ")}`;
}

function kmText(remaining: number): string {
  if (remaining < 0) return `${formatKm(-remaining)} overdue`;
  if (remaining === 0) return "due now";
  return `${formatKm(remaining)} to go`;
}

function daysText(days: number): string {
  if (days < 0) return `${plural(-days, "day")} overdue`;
  if (days === 0) return "due today";
  return `in ${plural(days, "day")}`;
}

// Text weight follows the status of each line so the reason for a warning is easy to spot.
function emphasis(status: ReminderStatus) {
  if (status === "overdue") return "font-medium text-red-700";
  if (status === "due-soon") return "font-medium text-amber-800";
  return "text-slate-700";
}

export default function ReminderCard({
  reminder,
  state,
  subtitle,
  actions,
}: {
  reminder: Reminder;
  state: ReminderState;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900">{reminder.serviceType}</h3>
          <p className="text-xs text-slate-500">
            {subtitle && <>{subtitle} · </>}
            {describeInterval(reminder)}
          </p>
        </div>
        <StatusBadge status={state.status} />
      </div>

      {state.status === "no-history" ? (
        <p className="text-sm text-slate-600">
          No “{reminder.serviceType}” service logged yet. Add a record to start tracking when it’s due.
        </p>
      ) : (
        <div>
          <dl className="space-y-1 text-sm">
            {state.byKm && (
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="text-slate-500">Due at {formatKm(state.byKm.dueAt)}</dt>
                <dd className={emphasis(state.byKm.status)}>{kmText(state.byKm.remaining)}</dd>
              </div>
            )}
            {state.byTime && (
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="text-slate-500">Due {formatDate(state.byTime.dueOn)}</dt>
                <dd className={emphasis(state.byTime.status)}>{daysText(state.byTime.remainingDays)}</dd>
              </div>
            )}
          </dl>
          {state.lastService && (
            <p className="pt-2 text-xs text-slate-500">
              Last done {formatDate(state.lastService.date)} at {formatKm(state.lastService.mileage)}
            </p>
          )}
        </div>
      )}

      {actions && <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2">{actions}</div>}
    </div>
  );
}
