export const COMMON_SERVICE_TYPES = [
  "Oil change",
  "Brakes",
  "Tires",
  "Tire rotation",
  "Wheel alignment",
  "Battery",
  "Air filter",
  "Cabin air filter",
  "Coolant flush",
  "Transmission fluid",
  "Spark plugs",
  "Wiper blades",
  "Inspection",
];

// Group service types case-insensitively for reporting and filtering, using the
// common list's spelling when there is one ("Oil Change" → "Oil change").
export function canonicalServiceType(type: string): string {
  const trimmed = type.trim();
  const key = trimmed.toLowerCase();
  return COMMON_SERVICE_TYPES.find((t) => t.toLowerCase() === key) ?? trimmed;
}

// Common suggestions first, then any custom types already used, deduplicated
// case-insensitively.
export function serviceTypeSuggestions(used: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const type of [...COMMON_SERVICE_TYPES, ...used]) {
    const key = type.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(type.trim());
    }
  }
  return result;
}
