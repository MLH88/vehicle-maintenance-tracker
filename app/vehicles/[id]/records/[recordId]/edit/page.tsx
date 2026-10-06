import Link from "next/link";
import { notFound } from "next/navigation";
import RecordForm from "@/components/RecordForm";
import { updateRecord } from "@/app/actions/records";
import { toDateInputValue, todayInputValue } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";
import { serviceTypeSuggestions } from "@/lib/serviceTypes";

export default async function EditRecordPage({
  params,
}: {
  params: { id: string; recordId: string };
}) {
  const vehicleId = parseId(params.id);
  const recordId = parseId(params.recordId);

  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, vehicleId },
    include: { vehicle: { select: { name: true } } },
  });
  if (!record) notFound();

  const used = await prisma.maintenanceRecord.findMany({
    where: { vehicleId },
    select: { serviceType: true },
    distinct: ["serviceType"],
  });

  return (
    <div className="max-w-2xl">
      <Link href={`/vehicles/${vehicleId}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← {record.vehicle.name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Edit record</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <RecordForm
          action={updateRecord.bind(null, vehicleId, recordId)}
          record={{ ...record, date: toDateInputValue(record.date) }}
          suggestions={serviceTypeSuggestions(used.map((u) => u.serviceType))}
          today={todayInputValue()}
          submitLabel="Save changes"
          cancelHref={`/vehicles/${vehicleId}`}
        />
      </div>
    </div>
  );
}
