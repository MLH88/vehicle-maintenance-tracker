"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/lib/form";
import { parseRecordForm } from "@/lib/validation";

export async function createRecord(
  vehicleId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = parseRecordForm(formData);
  if (!result.ok) return { errors: result.errors };

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) return { message: "This vehicle no longer exists." };

  await prisma.maintenanceRecord.create({ data: { ...result.data, vehicleId } });

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function updateRecord(
  vehicleId: number,
  recordId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = parseRecordForm(formData);
  if (!result.ok) return { errors: result.errors };

  // Scope by vehicle too, so a record can't be edited through another vehicle's URL.
  const { count } = await prisma.maintenanceRecord.updateMany({
    where: { id: recordId, vehicleId },
    data: result.data,
  });
  if (count === 0) return { message: "This record no longer exists." };

  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/vehicles/${vehicleId}`);
}

export async function deleteRecord(vehicleId: number, recordId: number): Promise<void> {
  await prisma.maintenanceRecord.deleteMany({ where: { id: recordId, vehicleId } });

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/");
}
