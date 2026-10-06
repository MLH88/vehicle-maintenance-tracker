import { notFound } from "next/navigation";

// Route ids are integers; anything else is a 404.
export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return id;
}
