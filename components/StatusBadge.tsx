import type { ReminderStatus } from "@/lib/reminders";

// Status is always shown as icon + label, never color alone.
const STYLES: Record<ReminderStatus, { label: string; className: string; icon: React.ReactNode }> = {
  ok: {
    label: "OK",
    className: "bg-green-50 text-green-800 ring-green-600/30",
    icon: <path d="M3.5 8.5l3 3 6-7" />,
  },
  "due-soon": {
    label: "Due soon",
    className: "bg-amber-50 text-amber-800 ring-amber-600/40",
    icon: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3.5l2 1.5" />
      </>
    ),
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-50 text-red-800 ring-red-600/30",
    icon: (
      <>
        <path d="M8 4v5" />
        <path d="M8 11.5v.5" />
      </>
    ),
  },
  "no-history": {
    label: "No history",
    className: "bg-slate-100 text-slate-700 ring-slate-500/30",
    icon: <path d="M4 8h8" />,
  },
};

export default function StatusBadge({ status }: { status: ReminderStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {s.icon}
      </svg>
      {s.label}
    </span>
  );
}
