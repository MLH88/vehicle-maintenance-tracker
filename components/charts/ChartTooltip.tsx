// Tooltip card shared by the dashboard charts. Values use ink colors; the
// colored swatch beside each row carries the series identity.
export function TooltipCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
  footer?: { label: string; value: string };
}) {
  return (
    <div className="min-w-40 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-slate-900">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              {r.color && <span className="inline-block h-2 w-2 rounded-sm" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="tabular-nums text-slate-900">{r.value}</span>
          </li>
        ))}
      </ul>
      {footer && (
        <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 font-medium text-slate-900">
          <span>{footer.label}</span>
          <span className="tabular-nums">{footer.value}</span>
        </p>
      )}
    </div>
  );
}
