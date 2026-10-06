import Link from "next/link";
import { notFound } from "next/navigation";
import ReminderForm from "@/components/ReminderForm";
import { updateReminder } from "@/app/actions/reminders";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { serviceTypeSuggestions } from "@/lib/serviceTypes";

export default async function EditReminderPage({
  params,
}: {
  params: { id: string; reminderId: string };
}) {
  const vehicleId = parseId(params.id);
  const reminderId = parseId(params.reminderId);

  const reminder = await prisma.serviceReminder.findFirst({
    where: { id: reminderId, vehicleId },
    include: { vehicle: { select: { name: true } } },
  });
  if (!reminder) notFound();

  const used = await prisma.maintenanceRecord.findMany({
    where: { vehicleId },
    select: { serviceType: true },
    distinct: ["serviceType"],
  });

  return (
    <div className="max-w-xl">
      <Link href={`/vehicles/${vehicleId}#reminders`} className="text-sm text-slate-500 hover:text-slate-800">
        ← {reminder.vehicle.name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Edit reminder</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ReminderForm
          action={updateReminder.bind(null, vehicleId, reminderId)}
          reminder={reminder}
          suggestions={serviceTypeSuggestions(used.map((u) => u.serviceType))}
          submitLabel="Save changes"
          cancelHref={`/vehicles/${vehicleId}#reminders`}
        />
      </div>
    </div>
  );
}
