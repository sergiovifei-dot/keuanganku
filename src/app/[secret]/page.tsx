import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, PiggyBank, Flame, HandCoins, Target as TargetIcon } from "lucide-react";
import Link from "next/link";
import { getWallets, getCategories, getAllTransactions, getBudgets, getDebts, getDebtPayments, getGoals, getContributions } from "@/lib/queries";
import { kpiBulan, tren12Bulan, komposisiPengeluaran, heatmapHarian, inRange, sumBy } from "@/lib/analytics";
import { saldoDompet, realisasiAnggaran, ringkasHutang, targetPerBulan } from "@/lib/finance";
import { formatRupiah, formatPercent, formatCompact } from "@/lib/format";
import { periodKey, todayISO, daysUntil, namaBulan } from "@/lib/dates";
import { colorHex } from "@/lib/colors";
import { Card, Money, ProgressBar, Badge, EmptyState } from "@/components/ui";
import { TrenChart, DonutChart } from "@/components/dashboard-charts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export const dynamic = "force-dynamic";

function Delta({ v }: { v: number | null }) {
  if (v === null) return <span className="text-xs text-muted-foreground">—</span>;
  const up = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-income" : "text-expense"}`}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{formatPercent(Math.abs(v), 0)}
    </span>
  );
}

export default async function Dashboard({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const base = `/${secret}`;
  const now = new Date();
  const periode = periodKey(todayISO());
  const [wallets, categories, all, budgets, debts, payments, goals, contribs] = await Promise.all([
    getWallets(), getCategories(), getAllTransactions(), getBudgets(periode),
    getDebts(), getDebtPayments(), getGoals(), getContributions(),
  ]);

  const catName = new Map(categories.map((c) => [c.id, { nama: c.nama, warna: c.warna }]));
  const kpi = kpiBulan(all, now);
  const tren = tren12Bulan(all, now);
  const s = format(startOfMonth(now), "yyyy-MM-dd"), e = format(endOfMonth(now), "yyyy-MM-dd");
  const bulanIni = all.filter((t) => inRange(t, s, e));
  const komposisi = komposisiPengeluaran(bulanIni, catName);

  const totalSaldo = wallets.filter((w) => !w.isArchived)
    .reduce((sum, w) => sum + saldoDompet(w.saldoAwal, w.id, all), 0);
  const walletSaldo = wallets.filter((w) => !w.isArchived)
    .map((w) => ({ ...w, saldo: saldoDompet(w.saldoAwal, w.id, all) }));
  const maxSaldo = Math.max(1, ...walletSaldo.map((w) => Math.abs(w.saldo)));

  const top5 = bulanIni.filter((t) => t.tipe === "expense").sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);

  const hariIni = now.getDate();
  const totalHari = endOfMonth(now).getDate();
  const anggaranProgress = budgets.map((b) => {
    const terpakai = bulanIni.filter((t) => t.tipe === "expense" && t.categoryId === b.categoryId).reduce((a, t) => a + t.jumlah, 0);
    return { ...b, ...realisasiAnggaran(b.jumlahAnggaran, terpakai, b.ambangAlert, hariIni, totalHari), nama: catName.get(b.categoryId)?.nama ?? "?" };
  }).sort((a, b) => b.persen - a.persen);

  // Hutang & piutang
  const payByDebt = new Map<number, number[]>();
  for (const p of payments) { const arr = payByDebt.get(p.debtId) ?? []; arr.push(p.jumlah); payByDebt.set(p.debtId, arr); }
  for (const t of all) { if (t.debtId) { const arr = payByDebt.get(t.debtId) ?? []; arr.push(t.jumlah); payByDebt.set(t.debtId, arr); } }
  const aktifDebts = debts.filter((d) => d.status !== "lunas");
  const outHutang = aktifDebts.filter((d) => d.tipe === "hutang").reduce((a, d) => a + ringkasHutang(d.jumlahPokok, payByDebt.get(d.id) ?? []).outstanding, 0);
  const outPiutang = aktifDebts.filter((d) => d.tipe === "piutang").reduce((a, d) => a + ringkasHutang(d.jumlahPokok, payByDebt.get(d.id) ?? []).outstanding, 0);
  const jatuhTempo30 = aktifDebts.filter((d) => d.tanggalJatuhTempo && daysUntil(d.tanggalJatuhTempo) <= 30 && daysUntil(d.tanggalJatuhTempo) >= 0);

  // Target
  const contribByGoal = new Map<number, number>();
  for (const c of contribs) contribByGoal.set(c.goalId, (contribByGoal.get(c.goalId) ?? 0) + c.jumlah);
  const goalsAktif = goals.filter((g) => g.status === "aktif").slice(0, 4);

  // Heatmap
  const heat = heatmapHarian(bulanIni);
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  const maxHeat = Math.max(1, ...[...heat.values()]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{namaBulan(periode)}</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-transparent lg:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground"><Wallet size={16} /><span className="text-xs font-medium">Total Saldo</span></div>
          <Money value={totalSaldo} size="xl" className="mt-1 block" />
        </Card>
        <Kpi icon={<ArrowUpRight size={16} />} label="Pemasukan" value={kpi.income} delta={kpi.dIncome} tone="income" />
        <Kpi icon={<ArrowDownRight size={16} />} label="Pengeluaran" value={kpi.expense} delta={kpi.dExpense} tone="expense" />
        <Kpi icon={<TrendingUp size={16} />} label="Arus Kas Bersih" value={kpi.net} delta={kpi.dNet} tone={kpi.net >= 0 ? "income" : "expense"} />
      </div>
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground"><PiggyBank size={16} /><span className="text-xs font-medium">Rasio Menabung bulan ini</span></div>
        <span className={`tnum font-display text-xl font-bold ${kpi.rate >= 0 ? "text-income" : "text-expense"}`}>{formatPercent(kpi.rate, 1)}</span>
      </Card>

      {/* Tren + Komposisi */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="mb-2 font-display text-sm font-semibold">Tren 12 Bulan</p>
          <TrenChart data={tren} />
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-income" /> Pemasukan</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-expense" /> Pengeluaran</span>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <p className="mb-2 font-display text-sm font-semibold">Komposisi Pengeluaran</p>
          {komposisi.length ? (
            <>
              <DonutChart data={komposisi} />
              <div className="mt-2 space-y-1">
                {komposisi.slice(0, 5).map((k) => (
                  <Link key={k.id} href={`${base}/transaksi?categoryId=${k.id}`} className="flex items-center justify-between text-sm hover:opacity-80">
                    <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colorHex(k.warna) }} />{k.nama}</span>
                    <span className="tnum text-muted-foreground">{formatRupiah(k.total)}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : <EmptyState title="Belum ada pengeluaran" desc="Catat transaksi pertamamu lewat tombol Catat." />}
        </Card>
      </div>

      {/* Anggaran + Saldo dompet */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-3 font-display text-sm font-semibold">Progress Anggaran</p>
          {anggaranProgress.length ? (
            <div className="space-y-3">
              {anggaranProgress.slice(0, 5).map((a) => (
                <div key={a.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{a.nama}</span>
                    <span className="tnum text-muted-foreground">{formatCompact(a.terpakai)} / {formatCompact(a.anggaran)}</span>
                  </div>
                  <ProgressBar value={a.persen} tone={a.status === "lewat" ? "expense" : a.status === "waspada" ? "warn" : "income"} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="Belum ada anggaran" desc="Atur anggaran bulanan agar pengeluaran terkendali." action={<Link href={`${base}/anggaran`} className="text-sm font-medium text-primary">Buat anggaran →</Link>} />}
        </Card>
        <Card>
          <p className="mb-3 font-display text-sm font-semibold">Saldo per Dompet</p>
          <div className="space-y-3">
            {walletSaldo.map((w) => (
              <div key={w.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colorHex(w.warna) }} />{w.nama}</span>
                  <span className="tnum font-medium">{formatRupiah(w.saldo)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(Math.abs(w.saldo) / maxSaldo) * 100}%`, background: colorHex(w.warna) }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top 5 + Heatmap */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-3 font-display text-sm font-semibold">5 Pengeluaran Terbesar Bulan Ini</p>
          {top5.length ? (
            <ol className="space-y-2">
              {top5.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>{catName.get(t.categoryId ?? -1)?.nama ?? "Lainnya"}{t.catatan ? ` · ${t.catatan}` : ""}</span>
                  <span className="tnum font-medium text-expense">{formatRupiah(t.jumlah)}</span>
                </li>
              ))}
            </ol>
          ) : <EmptyState title="Belum ada pengeluaran bulan ini" />}
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2"><Flame size={16} className="text-c3" /><p className="font-display text-sm font-semibold">Heatmap Pengeluaran Harian</p></div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const val = heat.get(key) ?? 0;
              const intensity = val / maxHeat;
              return (
                <div key={key} title={`${format(d, "d MMM")}: ${formatRupiah(val)}`}
                  className="aspect-square rounded-[4px]"
                  style={{ background: val ? `hsl(var(--expense) / ${0.15 + intensity * 0.85})` : "hsl(var(--muted))" }} />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Warna makin pekat = pengeluaran makin besar.</p>
        </Card>
      </div>

      {/* Hutang + Target */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2"><HandCoins size={16} className="text-c5" /><p className="font-display text-sm font-semibold">Hutang & Piutang</p></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-expense/10 p-3"><p className="text-xs text-muted-foreground">Total Hutang</p><Money value={outHutang} className="text-expense" /></div>
            <div className="rounded-lg bg-income/10 p-3"><p className="text-xs text-muted-foreground">Total Piutang</p><Money value={outPiutang} className="text-income" /></div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{jatuhTempo30.length ? <>Ada <b className="text-foreground">{jatuhTempo30.length}</b> yang jatuh tempo ≤30 hari.</> : "Tidak ada yang jatuh tempo dalam 30 hari."}</p>
          <Link href={`${base}/hutang`} className="mt-2 inline-block text-sm font-medium text-primary">Lihat detail →</Link>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2"><TargetIcon size={16} className="text-primary" /><p className="font-display text-sm font-semibold">Progress Target Menabung</p></div>
          {goalsAktif.length ? (
            <div className="space-y-3">
              {goalsAktif.map((g) => {
                const terkumpul = contribByGoal.get(g.id) ?? 0;
                const pct = g.jumlahTarget > 0 ? (terkumpul / g.jumlahTarget) * 100 : 0;
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex justify-between text-sm"><span>{g.nama}</span><span className="tnum text-muted-foreground">{formatPercent(pct, 0)}</span></div>
                    <ProgressBar value={pct} tone="primary" />
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="Belum ada target" action={<Link href={`${base}/target`} className="text-sm font-medium text-primary">Buat target →</Link>} />}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, delta, tone }: { icon: React.ReactNode; label: string; value: number; delta: number | null; tone: "income" | "expense" }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-muted-foreground"><span className={tone === "income" ? "text-income" : "text-expense"}>{icon}</span><span className="text-xs font-medium">{label}</span></div>
      <Money value={value} size="lg" className={`mt-1 block ${tone === "income" ? "text-income" : "text-expense"}`} />
      <div className="mt-1"><Delta v={delta} /> <span className="text-xs text-muted-foreground">vs bln lalu</span></div>
    </Card>
  );
}
