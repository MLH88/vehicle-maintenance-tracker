"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/lib/form";
import { parseVehicleForm } from "@/lib/validation";

export async function createVehicle(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = parseVehicleForm(formData);
  if (!result.ok) return { errors: result.errors };

  const vehicle = await prisma.vehicle.create({ data: result.data });

  revalidatePath("/");
  redirect(`/vehicles/${vehicle.id}`);
}

export async function updateVehicle(
  vehicleId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = parseVehicleForm(formData);
  if (!result.ok) return { errors: result.errors };

  const { count } = await prisma.vehicle.updateMany({
    where: { id: vehicleId },
    data: result.data,
  });
  if (count === 0) return { message: "This vehicle no longer exists." };

  revalidatePath("/");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/vehicles/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  // Records and reminders are removed by the cascade in the schema.
  await prisma.vehicle.deleteMany({ where: { id: vehicleId } });

  revalidatePath("/");
  redirect("/");
}
