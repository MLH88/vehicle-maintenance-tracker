"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { TooltipCard } from "@/components/charts/ChartTooltip";
import { CHART_INK } from "@/lib/chartColors";
import { formatCurrency, formatCurrencyWhole, formatMonth } from "@/lib/format";
import type { ChartSeries, MonthlyRow } from "@/lib/stats";

type BarShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  payload: MonthlyRow;
};

// Only the top segment of each stack gets rounded corners; everything else is
// square so the stack reads as one column.
function makeSegmentShape(series: ChartSeries[], index: number) {
  const above = series.slice(index + 1).map((s) => s.key);
  function SegmentShape({ x, y, width, height, fill, payload }: BarShapeProps) {
    if (!height || height <= 0) return null;
    const isTop = above.every((key) => !payload[key]);
    const r = isTop ? Math.min(4, height, width / 2) : 0;
    const d = `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
    // The surface-colored stroke leaves a 2px gap between stacked segments.
    return <path d={d} fill={fill} stroke={CHART_INK.surface} strokeWidth={2} />;
  }
  return SegmentShape;
}

// Round y-axis ticks (0, 100, 200, …) with roughly four steps up to the tallest month.
function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

function MonthlyTooltip({ active, payload, series }: TooltipProps<number, string> & { series: ChartSeries[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as MonthlyRow;
  return (
    <TooltipCard
      title={formatMonth(new Date(`${row.month}-01T12:00:00`), "long")}
      rows={series.map((s) => ({ label: s.label, value: formatCurrency(row[s.key] as number), color: s.color }))}
      footer={series.length > 1 ? { label: "Total", value: formatCurrency(row.total) } : undefined}
    />
  );
}

export default function MonthlyCostChart({ rows, series }: { rows: MonthlyRow[]; series: ChartSeries[] }) {
  const ticks = niceTicks(Math.max(0, ...rows.map((r) => r.total)));
  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div className="h-64" role="img" aria-label="Monthly maintenance cost by vehicle for the last 12 months. A table view follows.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: CHART_INK.grid }}
              tick={{ fill: CHART_INK.axis, fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              tickFormatter={formatCurrencyWhole}
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART_INK.axis, fontSize: 12 }}
              width={64}
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1]]}
            />
            <Tooltip
              content={<MonthlyTooltip series={series} />}
              cursor={{ fill: "#f1f5f9" }}
              isAnimationActive={false}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="cost"
                fill={s.color}
                maxBarSize={24}
                isAnimationActive={false}
                shape={makeSegmentShape(series, i) as never}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Show as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th scope="col" className="py-1 pr-4 font-medium">Month</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="py-1 pr-4 text-right font-medium">{s.label}</th>
                ))}
                {series.length > 1 && <th scope="col" className="py-1 text-right font-medium">Total</th>}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-slate-100">
                  <th scope="row" className="py-1 pr-4 font-normal">{r.label}</th>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 pr-4 text-right">{formatCurrency(r[s.key] as number)}</td>
                  ))}
                  {series.length > 1 && <td className="py-1 text-right font-medium">{formatCurrency(r.total)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
