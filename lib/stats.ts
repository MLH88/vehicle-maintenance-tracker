import { OTHER_COLOR, SERIES_COLORS } from "@/lib/chartColors";
import { formatMonth } from "@/lib/format";
import { canonicalServiceType } from "@/lib/serviceTypes";

type VehicleLike = { id: number; name: string };
type RecordLike = { vehicleId: number; date: Date; cost: number; serviceType: string };

export type ChartSeries = { key: string; label: string; color: string };
export type MonthlyRow = { month: string; label: string; total: number } & Record<string, number | string>;
export type ServiceTypeRow = { serviceType: string; total: number; count: number };

const MAX_SERIES = SERIES_COLORS.length;
const MAX_SERVICE_TYPES = 8;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// The calendar month containing `now` plus the 11 before it, oldest first.
export function last12Months(now = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      key: monthKey(d),
      label: formatMonth(d),
      start: d,
    };
  });
}

// Vehicles are passed in a stable order (creation order), so each keeps its
// color as others are added. Vehicles past the eighth share an "Other" series.
export function vehicleSeries(vehicles: VehicleLike[]): { series: ChartSeries[]; keyFor: (id: number) => string } {
  const overflow = vehicles.length > MAX_SERIES;
  const named = overflow ? vehicles.slice(0, MAX_SERIES - 1) : vehicles;
  const series: ChartSeries[] = named.map((v, i) => ({
    key: `v${v.id}`,
    label: v.name,
    color: SERIES_COLORS[i],
  }));
  if (overflow) series.push({ key: "other", label: "Other vehicles", color: OTHER_COLOR });
  const namedIds = new Set(named.map((v) => v.id));
  return { series, keyFor: (id) => (namedIds.has(id) ? `v${id}` : "other") };
}

export function monthlyCostByVehicle(vehicles: VehicleLike[], records: RecordLike[], now = new Date()) {
  const { series, keyFor } = vehicleSeries(vehicles);
  const months = last12Months(now);
  const rows = new Map<string, MonthlyRow>(
    months.map((m) => [
      m.key,
      { month: m.key, label: m.label, total: 0, ...Object.fromEntries(series.map((s) => [s.key, 0])) },
    ]),
  );

  for (const r of records) {
    const row = rows.get(monthKey(r.date));
    if (!row) continue; // outside the 12-month window
    const key = keyFor(r.vehicleId);
    row[key] = round2((row[key] as number) + r.cost);
    row.total = round2(row.total + r.cost);
  }

  return { series, rows: Array.from(rows.values()), since: months[0].start };
}

// Spend per service type, largest first; the long tail folds into "Other".
export function costByServiceType(records: RecordLike[]): ServiceTypeRow[] {
  const totals = new Map<string, ServiceTypeRow>();
  for (const r of records) {
    const type = canonicalServiceType(r.serviceType);
    const row = totals.get(type.toLowerCase()) ?? { serviceType: type, total: 0, count: 0 };
    row.total = round2(row.total + r.cost);
    row.count += 1;
    totals.set(type.toLowerCase(), row);
  }

  const sorted = Array.from(totals.values()).sort((a, b) => b.total - a.total);
  if (sorted.length <= MAX_SERVICE_TYPES) return sorted;

  const head = sorted.slice(0, MAX_SERVICE_TYPES - 1);
  const tail = sorted.slice(MAX_SERVICE_TYPES - 1);
  return [
    ...head,
    {
      serviceType: `Other (${tail.length} types)`,
      total: round2(tail.reduce((s, r) => s + r.total, 0)),
      count: tail.reduce((s, r) => s + r.count, 0),
    },
  ];
}
