"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { TooltipCard } from "@/components/charts/ChartTooltip";
import { CHART_INK, SERIES_COLORS } from "@/lib/chartColors";
import { formatCurrency, formatCurrencyWhole } from "@/lib/format";
import type { ServiceTypeRow } from "@/lib/stats";

const ROW_HEIGHT = 36;

function ServiceTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ServiceTypeRow;
  return (
    <TooltipCard
      title={row.serviceType}
      rows={[
        { label: "Spent", value: formatCurrency(row.total) },
        { label: "Services", value: String(row.count) },
      ]}
    />
  );
}

// One series, so every bar is the same color and there's no legend. Each bar
// is labeled with its value, which is why there's no value axis.
export default function ServiceTypeChart({ rows }: { rows: ServiceTypeRow[] }) {
  return (
    <div>
      <div
        style={{ height: rows.length * ROW_HEIGHT + 8 }}
        role="img"
        aria-label="Maintenance cost by service type. A table view follows."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="serviceType"
              width={150}
              tickLine={false}
              axisLine={{ stroke: CHART_INK.grid }}
              tick={{ fill: "#334155", fontSize: 12 }}
            />
            <Tooltip content={<ServiceTooltip />} cursor={{ fill: "#f1f5f9" }} isAnimationActive={false} />
            <Bar
              dataKey="total"
              fill={SERIES_COLORS[0]}
              maxBarSize={20}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="total"
                position="right"
                formatter={(v: number) => formatCurrencyWhole(v)}
                style={{ fill: "#334155", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Show as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th scope="col" className="py-1 pr-4 font-medium">Service type</th>
                <th scope="col" className="py-1 pr-4 text-right font-medium">Services</th>
                <th scope="col" className="py-1 text-right font-medium">Spent</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.serviceType} className="border-t border-slate-100">
                  <th scope="row" className="py-1 pr-4 font-normal">{r.serviceType}</th>
                  <td className="py-1 pr-4 text-right">{r.count}</td>
                  <td className="py-1 text-right">{formatCurrency(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
