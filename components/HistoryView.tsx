"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { Select, inputClass, secondaryButtonClass } from "@/components/forms";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatCurrency, formatDay, formatKm, formatNumber } from "@/lib/format";

export type HistoryRow = {
  id: number;
  vehicleId: number;
  vehicleName: string;
  serviceType: string;
  serviceGroup: string; // case-insensitive grouping used by the type filter
  date: string; // YYYY-MM-DD
  mileage: number;
  cost: number;
  shopName: string | null;
  notes: string | null;
};

export type HistoryFilters = {
  q: string;
  vehicle: string; // vehicle id, or "" for all
  type: string; // service group, or "" for all
  from: string; // YYYY-MM-DD or ""
  to: string;
};

const EMPTY_FILTERS: HistoryFilters = { q: "", vehicle: "", type: "", from: "", to: "" };

function applyFilters(rows: HistoryRow[], f: HistoryFilters): HistoryRow[] {
  // Every word must appear somewhere in the record, so "oil downtown" narrows.
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((r) => {
    if (f.vehicle && String(r.vehicleId) !== f.vehicle) return false;
    if (f.type && r.serviceGroup !== f.type) return false;
    // YYYY-MM-DD strings compare correctly as plain strings; both ends inclusive.
    if (f.from && r.date < f.from) return false;
    if (f.to && r.date > f.to) return false;
    if (terms.length) {
      const haystack = [r.serviceType, r.vehicleName, r.shopName, r.notes].join(" ").toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}

function exportCsv(rows: HistoryRow[], today: string) {
  const csv = toCsv(
    ["Date", "Vehicle", "Service type", "Mileage (km)", "Cost", "Shop", "Notes"],
    rows.map((r) => [r.date, r.vehicleName, r.serviceType, r.mileage, r.cost.toFixed(2), r.shopName, r.notes]),
  );
  downloadCsv(`maintenance-history-${today}.csv`, csv);
}

export default function HistoryView({
  rows,
  vehicles,
  serviceTypes,
  initialFilters,
  today,
}: {
  rows: HistoryRow[];
  vehicles: { id: number; name: string }[];
  serviceTypes: string[];
  initialFilters: HistoryFilters;
  today: string;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const set = (key: keyof HistoryFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  // Mirror filters into the URL without a server round trip.
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters]);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const total = filtered.reduce((sum, r) => sum + r.cost, 0);
  const isFiltered = Object.values(filters).some(Boolean);
  const badRange = Boolean(filters.from && filters.to && filters.from > filters.to);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">Search</label>
          <input
            id="q"
            type="search"
            placeholder="Service, shop, notes…"
            value={filters.q}
            onChange={set("q")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vehicle" className="mb-1 block text-xs font-medium text-slate-600">Vehicle</label>
          <Select id="vehicle" value={filters.vehicle} onChange={set("vehicle")}>
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={String(v.id)}>{v.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="type" className="mb-1 block text-xs font-medium text-slate-600">Service type</label>
          <Select id="type" value={filters.type} onChange={set("type")}>
            <option value="">All types</option>
            {serviceTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="from" className="mb-1 block text-xs font-medium text-slate-600">From</label>
          <input id="from" type="date" max={filters.to || today} value={filters.from} onChange={set("from")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs font-medium text-slate-600">To</label>
          <input id="to" type="date" min={filters.from || undefined} max={today} value={filters.to} onChange={set("to")} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600" aria-live="polite">
          {formatNumber(filtered.length)} of {formatNumber(rows.length)} records · {formatCurrency(total)}
          {isFiltered && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-3 font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </p>
        <button
          type="button"
          onClick={() => exportCsv(filtered, today)}
          disabled={filtered.length === 0}
          className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Export CSV
        </button>
      </div>

      {badRange && (
        <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The “From” date is after the “To” date.
        </p>
      )}

      {filtered.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState
            title="No maintenance records yet"
            description={
              <>
                Records you add on a{" "}
                <Link href="/" className="font-medium text-blue-600 hover:text-blue-800">
                  vehicle&apos;s page
                </Link>{" "}
                will show up here.
              </>
            }
          />
        ) : (
          <EmptyState
            title="No records match these filters"
            action={
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={secondaryButtonClass}>
                Clear filters
              </button>
            }
          />
        )
      ) : (
        <>
          {/* Phones: stacked cards */}
          <ul className="space-y-3 sm:hidden">
            {filtered.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{r.serviceType}</p>
                    <p className="text-sm text-slate-500">
                      {formatDay(r.date)} · {r.vehicleName}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{formatCurrency(r.cost)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {formatKm(r.mileage)}
                  {r.shopName && ` · ${r.shopName}`}
                </p>
                {r.notes && <p className="mt-1 text-sm text-slate-500">{r.notes}</p>}
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <Link
                    href={`/vehicles/${r.vehicleId}/records/${r.id}/edit`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Larger screens: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm sm:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 font-medium">Vehicle</th>
                  <th scope="col" className="px-4 py-2 font-medium">Service</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Mileage</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Cost</th>
                  <th scope="col" className="px-4 py-2 font-medium">Shop</th>
                  <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3">{formatDay(r.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/vehicles/${r.vehicleId}`} className="hover:text-blue-700 hover:underline">
                        {r.vehicleName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.serviceType}</div>
                      {r.notes && <div className="mt-0.5 text-slate-500">{r.notes}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatKm(r.mileage)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(r.cost)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.shopName ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/vehicles/${r.vehicleId}/records/${r.id}/edit`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
