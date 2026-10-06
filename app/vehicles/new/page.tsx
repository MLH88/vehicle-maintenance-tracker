import VehicleForm from "@/components/VehicleForm";
import { createVehicle } from "@/app/actions/vehicles";

export default function NewVehiclePage() {
  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Add vehicle</h1>
      <VehicleForm action={createVehicle} cancelHref="/" submitLabel="Add vehicle" />
    </div>
  );
}
