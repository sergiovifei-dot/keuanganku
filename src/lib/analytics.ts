import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import type { TxRow } from "@/lib/queries";
import { savingsRate, perubahanPersen } from "@/lib/finance";

export function inRange(t: TxRow, start: string, end: string) {
  return t.tanggal >= start && t.tanggal <= end;
}
export function sumBy(txs: TxRow[], tipe: "income" | "expense") {
  return txs.filter((t) => t.tipe === tipe).reduce((a, b) => a + b.jumlah, 0);
}

export function kpiBulan(all: TxRow[], base = new Date()) {
  const s = format(startOfMonth(base), "yyyy-MM-dd");
  const e = format(endOfMonth(base), "yyyy-MM-dd");
  const lm = subMonths(base, 1);
  const ls = format(startOfMonth(lm), "yyyy-MM-dd");
  const le = format(endOfMonth(lm), "yyyy-MM-dd");
  const cur = all.filter((t) => inRange(t, s, e));
  const prev = all.filter((t) => inRange(t, ls, le));
  const income = sumBy(cur, "income"), expense = sumBy(cur, "expense");
  const pIncome = sumBy(prev, "income"), pExpense = sumBy(prev, "expense");
  return {
    income, expense, net: income - expense, rate: savingsRate(income, expense),
    dIncome: perubahanPersen(income, pIncome), dExpense: perubahanPersen(expense, pExpense),
    dNet: perubahanPersen(income - expense, pIncome - pExpense),
  };
}

export function tren12Bulan(all: TxRow[], base = new Date()) {
  const out: { bulan: string; pemasukan: number; pengeluaran: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(base, i);
    const s = format(startOfMonth(d), "yyyy-MM-dd"), e = format(endOfMonth(d), "yyyy-MM-dd");
    const m = all.filter((t) => inRange(t, s, e));
    out.push({ bulan: format(d, "MMM"), pemasukan: sumBy(m, "income"), pengeluaran: sumBy(m, "expense") });
  }
  return out;
}

export function komposisiPengeluaran(txs: TxRow[], catName: Map<number, { nama: string; warna: string }>) {
  const map = new Map<number, number>();
  for (const t of txs) if (t.tipe === "expense" && t.categoryId) map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.jumlah);
  return [...map.entries()]
    .map(([id, total]) => ({ id, nama: catName.get(id)?.nama ?? "Lainnya", warna: catName.get(id)?.warna ?? "slate", total }))
    .sort((a, b) => b.total - a.total);
}

export function heatmapHarian(txs: TxRow[]) {
  const map = new Map<string, number>();
  for (const t of txs) if (t.tipe === "expense") map.set(t.tanggal, (map.get(t.tanggal) ?? 0) + t.jumlah);
  return map;
}
