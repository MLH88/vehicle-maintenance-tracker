import HistoryView, { type HistoryFilters, type HistoryRow } from "@/components/HistoryView";
import { toDateInputValue, todayInputValue } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { canonicalServiceType } from "@/lib/serviceTypes";

export const dynamic = "force-dynamic";

function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [records, vehicles] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { vehicle: { select: { name: true } } },
    }),
    prisma.vehicle.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const rows: HistoryRow[] = records.map((r) => ({
    id: r.id,
    vehicleId: r.vehicleId,
    vehicleName: r.vehicle.name,
    serviceType: r.serviceType,
    serviceGroup: canonicalServiceType(r.serviceType),
    date: toDateInputValue(r.date),
    mileage: r.mileage,
    cost: r.cost,
    shopName: r.shopName,
    notes: r.notes,
  }));

  const serviceTypes = Array.from(new Set(rows.map((r) => r.serviceGroup))).sort((a, b) => a.localeCompare(b));

  // Filters live in the URL so a filtered view can be bookmarked or shared.
  const initialFilters: HistoryFilters = {
    q: param(searchParams.q),
    vehicle: param(searchParams.vehicle),
    type: param(searchParams.type),
    from: param(searchParams.from),
    to: param(searchParams.to),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">History</h1>
      <HistoryView
        rows={rows}
        vehicles={vehicles}
        serviceTypes={serviceTypes}
        initialFilters={initialFilters}
        today={todayInputValue()}
      />
    </div>
  );
}
