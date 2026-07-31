import Link from "next/link";
import { getAllTransactions, getCategories } from "@/lib/queries";
import { formatRupiah, formatPercent } from "@/lib/format";
import { perubahanPersen, savingsRate } from "@/lib/finance";
import { namaBulan, periodKey, todayISO } from "@/lib/dates";
import { Card, Money } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear } from "date-fns";

export const dynamic = "force-dynamic";

export default async function LaporanPage({ params, searchParams }: {
  params: Promise<{ secret: string }>; searchParams: Promise<{ mode?: string; periode?: string }>;
}) {
  const { secret } = await params;
  const sp = await searchParams;
  const base = `/${secret}/laporan`;
  const mode = sp.mode === "tahunan" ? "tahunan" : "bulanan";
  const periode = sp.periode ?? periodKey(todayISO());
  const [all, categories] = await Promise.all([getAllTransactions(), getCategories()]);
  const catName = new Map(categories.map((c) => [c.id, c.nama]));

  const anchor = new Date(periode + "-01");
  const start = mode === "tahunan" ? format(startOfYear(anchor), "yyyy-MM-dd") : format(startOfMonth(anchor), "yyyy-MM-dd");
  const end = mode === "tahunan" ? format(endOfYear(anchor), "yyyy-MM-dd") : format(endOfMonth(anchor), "yyyy-MM-dd");
  const rows = all.filter((t) => t.tanggal >= start && t.tanggal <= end);

  const income = rows.filter((t) => t.tipe === "income").reduce((a, t) => a + t.jumlah, 0);
  const expense = rows.filter((t) => t.tipe === "expense").reduce((a, t) => a + t.jumlah, 0);

  const perCat = (tipe: "income" | "expense") => {
    const m = new Map<number, number>();
    for (const t of rows) if (t.tipe === tipe && t.categoryId) m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + t.jumlah);
    return [...m.entries()].map(([id, v]) => ({ nama: catName.get(id) ?? "Lainnya", v })).sort((a, b) => b.v - a.v);
  };

  // Perbandingan: bulan ini vs lalu vs rata2 6 bulan (khusus mode bulanan)
  const monthSum = (d: Date, tipe: "income" | "expense") => {
    const s = format(startOfMonth(d), "yyyy-MM-dd"), e = format(endOfMonth(d), "yyyy-MM-dd");
    return all.filter((t) => t.tipe === tipe && t.tanggal >= s && t.tanggal <= e).reduce((a, t) => a + t.jumlah, 0);
  };
  const lastExp = monthSum(subMonths(anchor, 1), "expense");
  let avg6 = 0; for (let i = 1; i <= 6; i++) avg6 += monthSum(subMonths(anchor, i), "expense"); avg6 = Math.round(avg6 / 6);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Laporan</h1>
        <PrintButton />
      </div>
      <div className="flex gap-2">
        <Link href={`${base}?mode=bulanan&periode=${periode}`} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${mode === "bulanan" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Bulanan</Link>
        <Link href={`${base}?mode=tahunan&periode=${periode}`} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${mode === "tahunan" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Tahunan</Link>
        <span className="ml-auto self-center text-sm text-muted-foreground">{mode === "tahunan" ? anchor.getFullYear() : namaBulan(periode)}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-muted-foreground">Pemasukan</p><Money value={income} className="text-income" /></Card>
        <Card><p className="text-xs text-muted-foreground">Pengeluaran</p><Money value={expense} className="text-expense" /></Card>
        <Card><p className="text-xs text-muted-foreground">Laba/Rugi</p><Money value={income - expense} className={income - expense >= 0 ? "text-income" : "text-expense"} /></Card>
      </div>

      <Card>
        <p className="mb-3 font-display text-sm font-semibold">Laba Rugi Pribadi</p>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-income">Pemasukan</p>
            <table className="w-full text-sm">
              <tbody>{perCat("income").map((r) => <tr key={r.nama} className="border-b last:border-0"><td className="py-1.5">{r.nama}</td><td className="tnum py-1.5 text-right">{formatRupiah(r.v)}</td></tr>)}
                <tr className="font-semibold"><td className="py-1.5">Total</td><td className="tnum py-1.5 text-right text-income">{formatRupiah(income)}</td></tr></tbody>
            </table>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-expense">Pengeluaran</p>
            <table className="w-full text-sm">
              <tbody>{perCat("expense").map((r) => <tr key={r.nama} className="border-b last:border-0"><td className="py-1.5">{r.nama}</td><td className="tnum py-1.5 text-right">{formatRupiah(r.v)}</td></tr>)}
                <tr className="font-semibold"><td className="py-1.5">Total</td><td className="tnum py-1.5 text-right text-expense">{formatRupiah(expense)}</td></tr></tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
          <span className="font-medium">Rasio menabung</span>
          <span className={`tnum font-display font-bold ${savingsRate(income, expense) >= 0 ? "text-income" : "text-expense"}`}>{formatPercent(savingsRate(income, expense), 1)}</span>
        </div>
      </Card>

      {mode === "bulanan" && (
        <Card>
          <p className="mb-3 font-display text-sm font-semibold">Perbandingan Pengeluaran</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xs text-muted-foreground">Bulan ini</p><p className="tnum mt-1 font-semibold">{formatRupiah(expense)}</p></div>
            <div><p className="text-xs text-muted-foreground">Bulan lalu</p><p className="tnum mt-1 font-semibold">{formatRupiah(lastExp)}</p><p className="text-xs">{fmtDelta(perubahanPersen(expense, lastExp))}</p></div>
            <div><p className="text-xs text-muted-foreground">Rata-rata 6 bln</p><p className="tnum mt-1 font-semibold">{formatRupiah(avg6)}</p><p className="text-xs">{fmtDelta(perubahanPersen(expense, avg6))}</p></div>
          </div>
        </Card>
      )}
    </div>
  );
}
function fmtDelta(v: number | null) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  return <span className={v <= 0 ? "text-income" : "text-expense"}>{v <= 0 ? "▼" : "▲"} {formatPercent(Math.abs(v), 0)}</span>;
}
