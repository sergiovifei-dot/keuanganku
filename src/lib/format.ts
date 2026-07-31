// Semua uang disimpan sebagai INTEGER rupiah (tanpa desimal) untuk hindari floating point.

/** Format angka rupiah -> "Rp 1.250.000" */
export function formatRupiah(amount: number, opts: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = opts;
  const neg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${withSymbol ? "Rp " : ""}${grouped}`;
}

/** Format ringkas: 1.250.000 -> "1,25 jt", 12.500 -> "12,5 rb" */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} rb`;
  return `${sign}${abs}`;
}

/** Ubah string input "1.250.000" atau "1250000" -> integer 1250000 */
export function parseRupiahInput(input: string): number {
  const digits = input.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}
