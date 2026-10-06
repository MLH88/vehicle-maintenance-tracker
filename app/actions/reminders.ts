"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/lib/form";
import { canonicalServiceType } from "@/lib/serviceTypes";
import { parseReminderForm } from "@/lib/validation";

// One reminder per service type per vehicle; names compare case-insensitively.
async function hasDuplicate(vehicleId: number, serviceType: string, excludeId?: number) {
  const existing = await prisma.serviceReminder.findMany({
    where: { vehicleId, NOT: excludeId ? { id: excludeId } : undefined },
    select: { serviceType: true },
  });
  const key = canonicalServiceType(serviceType).toLowerCase();
  return existing.some((r) => canonicalServiceType(r.serviceType).toLowerCase() === key);
}

function revalidate(vehicleId: number) {
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/");
}

export async function createReminder(
  vehicleId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = parseReminderForm(formData);
  if (!result.ok) return { errors: result.errors };

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) return { message: "This vehicle no longer exists." };
  if (await hasDuplicate(vehicleId, result.data.serviceType)) {
    return { errors: { serviceType: "This vehicle already has a reminder for that service." } };
  }

  await prisma.serviceReminder.create({ data: { ...result.data, vehicleId } });

  revalidate(vehicleId);
  return { ok: true };
}

export async function updateReminder(
  vehicleId: number,
  reminderId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = parseReminderForm(formData);
  if (!result.ok) return { errors: result.errors };

  if (await hasDuplicate(vehicleId, result.data.serviceType, reminderId)) {
    return { errors: { serviceType: "This vehicle already has a reminder for that service." } };
  }

  const { count } = await prisma.serviceReminder.updateMany({
    where: { id: reminderId, vehicleId },
    data: result.data,
  });
  if (count === 0) return { message: "This reminder no longer exists." };

  revalidate(vehicleId);
  redirect(`/vehicles/${vehicleId}#reminders`);
}

export async function deleteReminder(vehicleId: number, reminderId: number): Promise<void> {
  await prisma.serviceReminder.deleteMany({ where: { id: reminderId, vehicleId } });
  revalidate(vehicleId);
}
