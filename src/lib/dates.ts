import {
  format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear,
  differenceInCalendarDays, parseISO, addDays, addMonths, addWeeks, addYears,
} from "date-fns";
import { id } from "date-fns/locale";

export const TZ = "Asia/Jakarta";

export function todayISO(): string {
  // Tanggal "hari ini" menurut Asia/Jakarta (UTC+7), tanpa dependensi tz-database.
  const now = new Date();
  const jakarta = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return format(jakarta, "yyyy-MM-dd");
}

export function periodKey(dateISO: string): string {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function fmtTanggal(dateISO: string): string {
  return format(parseISO(dateISO), "d MMM yyyy", { locale: id });
}
export function fmtTanggalPendek(dateISO: string): string {
  return format(parseISO(dateISO), "d MMM", { locale: id });
}
export function namaBulan(periode: string): string {
  return format(parseISO(periode + "-01"), "MMMM yyyy", { locale: id });
}

export type RangePreset = "bulan-ini" | "bulan-lalu" | "3-bulan" | "tahun-ini";

export function resolveRange(preset: RangePreset, base = new Date()): { start: string; end: string } {
  const f = (d: Date) => format(d, "yyyy-MM-dd");
  switch (preset) {
    case "bulan-lalu": {
      const m = subMonths(base, 1);
      return { start: f(startOfMonth(m)), end: f(endOfMonth(m)) };
    }
    case "3-bulan":
      return { start: f(startOfMonth(subMonths(base, 2))), end: f(endOfMonth(base)) };
    case "tahun-ini":
      return { start: f(startOfYear(base)), end: f(endOfYear(base)) };
    case "bulan-ini":
    default:
      return { start: f(startOfMonth(base)), end: f(endOfMonth(base)) };
  }
}

export function daysUntil(dateISO: string): number {
  return differenceInCalendarDays(parseISO(dateISO), parseISO(todayISO()));
}

export function nextRun(freq: string, from: string): string {
  const d = parseISO(from);
  const f = (x: Date) => format(x, "yyyy-MM-dd");
  switch (freq) {
    case "harian": return f(addDays(d, 1));
    case "mingguan": return f(addWeeks(d, 1));
    case "tahunan": return f(addYears(d, 1));
    case "bulanan":
    default: return f(addMonths(d, 1));
  }
}

export { startOfMonth, endOfMonth, subMonths, format };
