import { getBudgets, getCategories, getAllTransactions } from "@/lib/queries";
import { realisasiAnggaran } from "@/lib/finance";
import { periodKey, todayISO, namaBulan } from "@/lib/dates";
import { AnggaranClient } from "@/components/anggaran-client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnggaranPage({ params, searchParams }: {
  params: Promise<{ secret: string }>; searchParams: Promise<{ periode?: string }>;
}) {
  const { secret } = await params;
  const sp = await searchParams;
  const periode = sp.periode ?? periodKey(todayISO());
  const prevPeriode = format(subMonths(new Date(periode + "-01"), 1), "yyyy-MM");
  const [budgets, categories, all] = await Promise.all([getBudgets(periode), getCategories(), getAllTransactions()]);

  const monthStart = periode + "-01";
  const monthEnd = format(endOfMonth(new Date(monthStart)), "yyyy-MM-dd");
  const now = new Date();
  const hariIni = periode === periodKey(todayISO()) ? now.getDate() : endOfMonth(new Date(monthStart)).getDate();
  const totalHari = endOfMonth(new Date(monthStart)).getDate();

  const catName = new Map(categories.map((c) => [c.id, c]));
  const rows = budgets.map((b) => {
    const terpakai = all.filter((t) => t.tipe === "expense" && t.categoryId === b.categoryId && t.tanggal >= monthStart && t.tanggal <= monthEnd).reduce((a, t) => a + t.jumlah, 0);
    const r = realisasiAnggaran(b.jumlahAnggaran, terpakai, b.ambangAlert, hariIni, totalHari);
    return { id: b.id, categoryId: b.categoryId, nama: catName.get(b.categoryId)?.nama ?? "?", warna: catName.get(b.categoryId)?.warna ?? "slate", ambangAlert: b.ambangAlert, ...r };
  }).sort((a, b) => b.persen - a.persen);

  const expenseCats = categories.filter((c) => c.tipe === "expense" && !c.isArchived).map((c) => ({ id: c.id, nama: c.nama }));
  return <AnggaranClient secret={secret} periode={periode} prevPeriode={prevPeriode} namaBulan={namaBulan(periode)} rows={rows} expenseCats={expenseCats} />;
}
