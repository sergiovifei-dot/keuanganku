export const CHART_COLORS = [
  "hsl(var(--c1))","hsl(var(--c2))","hsl(var(--c3))","hsl(var(--c4))",
  "hsl(var(--c5))","hsl(var(--c6))","hsl(var(--c7))","hsl(var(--c8))",
];
// Nama warna preset untuk dompet/kategori (disimpan sebagai key).
export const NAMED_COLORS: Record<string, string> = {
  violet: "#7c5cff", emerald: "#22c55e", amber: "#f59e0b", sky: "#0ea5e9",
  pink: "#ec4899", teal: "#14b8a6", orange: "#fb923c", lime: "#84cc16",
  red: "#ef4444", slate: "#64748b",
};
export function colorHex(key?: string | null): string {
  return (key && NAMED_COLORS[key]) || NAMED_COLORS.violet;
}
