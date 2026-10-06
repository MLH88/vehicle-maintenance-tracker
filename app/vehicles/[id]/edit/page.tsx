import { notFound } from "next/navigation";
import VehicleForm from "@/components/VehicleForm";
import { updateVehicle } from "@/app/actions/vehicles";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/params";

export default async function EditVehiclePage({ params }: { params: { id: string } }) {
  const id = parseId(params.id);
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Edit {vehicle.name}</h1>
      <VehicleForm
        action={updateVehicle.bind(null, id)}
        vehicle={vehicle}
        cancelHref={`/vehicles/${id}`}
        submitLabel="Save changes"
      />
    </div>
  );
}
