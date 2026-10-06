// All user-facing number and date formatting goes through here so every page
// (server and client) renders the same way. The locale is fixed so server- and
// client-rendered text always match.
const LOCALE = "en-US";

const currency = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD" });
const currencyWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

// For axis ticks and compact labels: $1,250 rather than $1,250.00.
export function formatCurrencyWhole(amount: number): string {
  return currencyWhole.format(amount);
}

export function formatNumber(n: number): string {
  return integer.format(n);
}

export function formatKm(km: number): string {
  return `${integer.format(km)} km`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, { year: "numeric", month: "short", day: "numeric" });
}

// For calendar-day strings (YYYY-MM-DD) passed to client components.
export function formatDay(value: string): string {
  return formatDate(new Date(`${value}T12:00:00`));
}

export function formatMonth(date: Date, style: "short" | "long" = "short"): string {
  return style === "short"
    ? date.toLocaleDateString(LOCALE, { month: "short", year: "2-digit" })
    : date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
