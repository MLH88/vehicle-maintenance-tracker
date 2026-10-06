import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import ReminderCard from "@/components/ReminderCard";
import StatusBadge from "@/components/StatusBadge";
import MonthlyCostChart from "@/components/charts/MonthlyCostChart";
import ServiceTypeChart from "@/components/charts/ServiceTypeChart";
import { formatCurrency, formatDate, formatKm, plural } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { compareStatus, reminderState, type ReminderStatus } from "@/lib/reminders";
import { costByServiceType, monthlyCostByVehicle, vehicleSeries } from "@/lib/stats";

export const dynamic = "force-dynamic";

const primaryButtonClass =
  "inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700";

export default async function DashboardPage() {
  const [vehicles, records, reminders] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] }),
    prisma.maintenanceRecord.findMany({
      select: { vehicleId: true, date: true, cost: true, serviceType: true, mileage: true },
    }),
    prisma.serviceReminder.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (vehicles.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <EmptyState
          title="No vehicles yet"
          description="Add a vehicle to start logging maintenance, costs and service reminders."
          action={
            <Link href="/vehicles/new" className={primaryButtonClass}>
              Add your first vehicle
            </Link>
          }
        />
      </div>
    );
  }

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const recordsByVehicle = new Map<number, typeof records>();
  for (const r of records) {
    recordsByVehicle.set(r.vehicleId, [...(recordsByVehicle.get(r.vehicleId) ?? []), r]);
  }

  // Per-vehicle totals (all time) for the cards.
  const statsFor = (id: number) => {
    const list = recordsByVehicle.get(id) ?? [];
    return {
      total: list.reduce((s, r) => s + r.cost, 0),
      count: list.length,
      last: list.reduce<Date | undefined>((d, r) => (!d || r.date > d ? r.date : d), undefined),
    };
  };

  const reminderRows = reminders
    .map((reminder) => {
      const vehicle = vehicleById.get(reminder.vehicleId)!;
      return {
        reminder,
        vehicle,
        state: reminderState(reminder, recordsByVehicle.get(vehicle.id) ?? [], vehicle.currentMileage),
      };
    })
    .sort((a, b) => compareStatus(a.state.status, b.state.status));

  // The most urgent reminder status per vehicle, for the card badge.
  const worstStatus = new Map<number, ReminderStatus>();
  for (const { vehicle, state } of reminderRows) {
    if (!worstStatus.has(vehicle.id)) worstStatus.set(vehicle.id, state.status);
  }
  const counts = {
    overdue: reminderRows.filter((r) => r.state.status === "overdue").length,
    dueSoon: reminderRows.filter((r) => r.state.status === "due-soon").length,
  };

  const { series } = vehicleSeries(vehicles);
  const seriesColor = new Map(series.map((s) => [s.key, s.color]));
  const monthly = monthlyCostByVehicle(vehicles, records);
  const recent = records.filter((r) => r.date >= monthly.since);
  const recentTotal = recent.reduce((sum, r) => sum + r.cost, 0);
  const byServiceType = costByServiceType(recent);

  return (
    <div className="space-y-10">
      {/* Vehicles */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <Link href="/vehicles/new" className={primaryButtonClass}>
            Add vehicle
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((v) => {
            const stats = statsFor(v.id);
            const color = seriesColor.get(`v${v.id}`);
            const status = worstStatus.get(v.id);
            return (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.id}`}
                  className="block h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 text-lg font-medium">
                        {/* Matches this vehicle's color in the monthly chart. */}
                        {color && (
                          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
                        )}
                        <span className="truncate">{v.name}</span>
                      </h2>
                      <p className="text-sm text-slate-500">
                        {v.year} {v.make} {v.model}
                      </p>
                    </div>
                    {status && status !== "ok" && <StatusBadge status={status} />}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">Total spend</dt>
                      <dd className="text-base font-semibold">{formatCurrency(stats.total)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Mileage</dt>
                      <dd className="font-medium">{formatKm(v.currentMileage)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Last service</dt>
                      <dd className="font-medium">{stats.last ? formatDate(stats.last) : "—"}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-slate-500">{plural(stats.count, "record")}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Reminders */}
      <section aria-labelledby="reminders-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="reminders-heading" className="text-lg font-medium">
            Service reminders
          </h2>
          {reminderRows.length > 0 && (
            <p className="text-sm text-slate-500">
              {counts.overdue + counts.dueSoon === 0
                ? "Everything is up to date"
                : [counts.overdue && `${counts.overdue} overdue`, counts.dueSoon && `${counts.dueSoon} due soon`]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          )}
        </div>
        {reminderRows.length === 0 ? (
          <EmptyState
            title="No service reminders"
            description="Open a vehicle to add reminders like “oil change every 8,000 km or 6 months”."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reminderRows.map(({ reminder, vehicle, state }) => (
              <li key={reminder.id}>
                <ReminderCard
                  reminder={reminder}
                  state={state}
                  subtitle={
                    <Link href={`/vehicles/${vehicle.id}#reminders`} className="hover:text-blue-700 hover:underline">
                      {vehicle.name}
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Spending */}
      <section aria-labelledby="spending-heading" className="space-y-6">
        <div>
          <h2 id="spending-heading" className="text-lg font-medium">
            Spending, last 12 months
          </h2>
          <p className="text-4xl font-semibold tracking-tight">{formatCurrency(recentTotal)}</p>
          <p className="text-sm text-slate-500">
            across {plural(recent.length, "service")} since {formatDate(monthly.since)}
          </p>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No maintenance in the last 12 months"
            description="Charts will appear once you log a service."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-3">
              <h3 className="mb-3 font-medium">Monthly cost</h3>
              <MonthlyCostChart rows={monthly.rows} series={series} />
            </div>
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
              <h3 className="mb-3 font-medium">Cost by service type</h3>
              <ServiceTypeChart rows={byServiceType} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
