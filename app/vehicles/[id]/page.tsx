import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import EmptyState from "@/components/EmptyState";
import RecordForm from "@/components/RecordForm";
import ReminderCard from "@/components/ReminderCard";
import ReminderForm from "@/components/ReminderForm";
import { secondaryButtonClass } from "@/components/forms";
import { deleteVehicle } from "@/app/actions/vehicles";
import { createRecord, deleteRecord } from "@/app/actions/records";
import { createReminder, deleteReminder } from "@/app/actions/reminders";
import { todayInputValue } from "@/lib/dates";
import { formatCurrency, formatDate, formatKm, plural } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { compareStatus, reminderState } from "@/lib/reminders";
import { serviceTypeSuggestions } from "@/lib/serviceTypes";

export const dynamic = "force-dynamic";

const linkClass = "text-sm font-medium text-blue-600 hover:text-blue-800";

export default async function VehiclePage({ params }: { params: { id: string } }) {
  const id = parseId(params.id);
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      maintenanceRecords: { orderBy: [{ date: "desc" }, { id: "desc" }] },
      serviceReminders: { orderBy: { id: "asc" } },
    },
  });
  if (!vehicle) notFound();

  const records = vehicle.maintenanceRecords;
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const suggestions = serviceTypeSuggestions([
    ...records.map((r) => r.serviceType),
    ...vehicle.serviceReminders.map((r) => r.serviceType),
  ]);
  const reminders = vehicle.serviceReminders
    .map((reminder) => ({ reminder, state: reminderState(reminder, records, vehicle.currentMileage) }))
    .sort((a, b) => compareStatus(a.state.status, b.state.status));

  return (
    <div className="space-y-10">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{vehicle.name}</h1>
            <p className="text-slate-500">
              {vehicle.year} {vehicle.make} {vehicle.model} · {formatKm(vehicle.currentMileage)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/vehicles/${id}/edit`} className={secondaryButtonClass}>
              Edit vehicle
            </Link>
            <ConfirmDeleteButton
              action={deleteVehicle.bind(null, id)}
              label="Delete vehicle"
              prompt={`Delete ${vehicle.name} and its ${plural(records.length, "record")}?`}
            />
          </div>
        </div>
      </div>

      {/* Reminders */}
      <section id="reminders" aria-labelledby="reminders-heading" className="scroll-mt-20 space-y-4">
        <h2 id="reminders-heading" className="text-lg font-medium">
          Service reminders
        </h2>
        {reminders.length === 0 ? (
          <EmptyState
            title="No reminders yet"
            description="Add one below, e.g. an oil change every 8,000 km or 6 months, to see when it's next due."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reminders.map(({ reminder, state }) => (
              <li key={reminder.id}>
                <ReminderCard
                  reminder={reminder}
                  state={state}
                  actions={
                    <>
                      <Link href={`/vehicles/${id}/reminders/${reminder.id}/edit`} className={linkClass}>
                        Edit
                      </Link>
                      <ConfirmDeleteButton
                        action={deleteReminder.bind(null, id, reminder.id)}
                        prompt="Delete this reminder?"
                      />
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-lg border border-slate-200 bg-white shadow-sm" open={reminders.length === 0}>
          <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-slate-700 hover:text-slate-900">
            Add a reminder
          </summary>
          <div className="border-t border-slate-100 px-5 py-4">
            <ReminderForm action={createReminder.bind(null, id)} suggestions={suggestions} submitLabel="Add reminder" />
          </div>
        </details>
      </section>

      {/* Records */}
      <section aria-labelledby="records-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="records-heading" className="text-lg font-medium">
            Maintenance records
          </h2>
          {records.length > 0 && (
            <p className="text-sm text-slate-500">
              {plural(records.length, "record")} · {formatCurrency(totalCost)} total
            </p>
          )}
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No maintenance records yet"
            description="Log the first service below to start tracking costs and reminders."
          />
        ) : (
          <>
            {/* Phones: stacked cards */}
            <ul className="space-y-3 sm:hidden">
              {records.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{r.serviceType}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(r.date)} · {formatKm(r.mileage)}
                      </p>
                    </div>
                    <p className="font-medium tabular-nums">{formatCurrency(r.cost)}</p>
                  </div>
                  {(r.shopName || r.notes) && (
                    <p className="mt-2 text-sm text-slate-600">
                      {r.shopName}
                      {r.shopName && r.notes && " · "}
                      {r.notes}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2">
                    <Link href={`/vehicles/${id}/records/${r.id}/edit`} className={linkClass}>
                      Edit
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteRecord.bind(null, id, r.id)}
                      prompt={`Delete this ${r.serviceType} record?`}
                    />
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
                    <th scope="col" className="px-4 py-2 font-medium">Service</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Mileage</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Cost</th>
                    <th scope="col" className="px-4 py-2 font-medium">Shop</th>
                    <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(r.date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.serviceType}</div>
                        {r.notes && <div className="mt-0.5 text-slate-500">{r.notes}</div>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatKm(r.mileage)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(r.cost)}</td>
                      <td className="px-4 py-3 text-slate-600">{r.shopName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <Link href={`/vehicles/${id}/records/${r.id}/edit`} className={linkClass}>
                            Edit
                          </Link>
                          <ConfirmDeleteButton
                            action={deleteRecord.bind(null, id, r.id)}
                            prompt={`Delete this ${r.serviceType} record?`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 font-medium">Add maintenance record</h3>
          <RecordForm
            action={createRecord.bind(null, id)}
            suggestions={suggestions}
            today={todayInputValue()}
            defaultMileage={vehicle.currentMileage}
            submitLabel="Add record"
          />
        </div>
      </section>
    </div>
  );
}
