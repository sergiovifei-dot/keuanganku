"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Trash2, AlertTriangle, X } from "lucide-react";
import { formatRupiah, formatPercent, parseRupiahInput } from "@/lib/format";
import { Card, ProgressBar, EmptyState, Badge } from "@/components/ui";
import { simpanAnggaran, salinAnggaran, hapusAnggaran } from "@/lib/actions";

type Row = { id: number | null; categoryId: number; nama: string; warna: string; anggaran: number; terpakai: number; sisa: number; persen: number; status: string; proyeksiAkhirBulan: number; ambangAlert: number };
type Cat = { id: number; nama: string };

export function AnggaranClient({ secret, periode, prevPeriode, namaBulan, rows, expenseCats }: {
  secret: string; periode: string; prevPeriode: string; namaBulan: string; rows: Row[]; expenseCats: Cat[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<null | { categoryId: number; anggaran: number; ambang: number }>(null);
  const [pending, start] = useTransition();

  const totalAnggaran = rows.reduce((a, r) => a + r.anggaran, 0);
  const totalTerpakai = rows.reduce((a, r) => a + r.terpakai, 0);
  const lewat = rows.filter((r) => r.status === "lewat");
  const waspada = rows.filter((r) => r.status === "waspada");

  function save() {
    if (!open) return;
    start(async () => {
      const res = await simpanAnggaran({ categoryId: open.categoryId, periode, jumlahAnggaran: open.anggaran, ambangAlert: open.ambang, isRecurring: false });
      if (res.ok) { setOpen(null); router.refresh(); }
    });
  }
  function copyPrev() {
    if (!confirm(`Salin semua anggaran dari bulan sebelumnya?`)) return;
    start(async () => { await salinAnggaran(prevPeriode, periode); router.refresh(); });
  }
  function del(id: number) {
    start(async () => { await hapusAnggaran(id); router.refresh(); });
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Anggaran</h1><p className="text-sm text-muted-foreground">{namaBulan}</p></div>
        <div className="flex gap-2">
          <button onClick={copyPrev} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Copy size={15} /> Salin bln lalu</button>
          <button onClick={() => setOpen({ categoryId: expenseCats[0]?.id ?? 0, anggaran: 0, ambang: 80 })} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus size={15} /> Anggaran</button>
        </div>
      </div>

      {(lewat.length > 0 || waspada.length > 0) && (
        <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${lewat.length ? "border-expense/30 bg-expense/10 text-expense" : "border-c3/30 bg-c3/10 text-c3"}`}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{lewat.length > 0 ? <><b>{lewat.length} kategori melewati anggaran</b> ({lewat.map((l) => l.nama).join(", ")}). </> : null}{waspada.length > 0 ? <>{waspada.length} kategori mendekati batas.</> : null}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-xs text-muted-foreground">Total Anggaran</p><p className="tnum mt-1 font-display text-xl font-bold">{formatRupiah(totalAnggaran)}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Terpakai</p><p className={`tnum mt-1 font-display text-xl font-bold ${totalTerpakai > totalAnggaran ? "text-expense" : ""}`}>{formatRupiah(totalTerpakai)}</p></Card>
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.categoryId}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{r.nama}</span>
                <div className="flex items-center gap-2">
                  {r.status === "lewat" && <Badge tone="expense">Lewat</Badge>}
                  {r.status === "waspada" && <Badge tone="warn">Waspada</Badge>}
                  <button onClick={() => setOpen({ categoryId: r.categoryId, anggaran: r.anggaran, ambang: r.ambangAlert })} className="text-xs font-medium text-primary">Ubah</button>
                  {r.id && <button onClick={() => del(r.id!)} className="text-expense"><Trash2 size={14} /></button>}
                </div>
              </div>
              <ProgressBar value={r.persen} tone={r.status === "lewat" ? "expense" : r.status === "waspada" ? "warn" : "income"} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span className="tnum">{formatRupiah(r.terpakai)} / {formatRupiah(r.anggaran)} · {formatPercent(r.persen, 0)}</span>
                <span className="tnum">Sisa {formatRupiah(r.sisa)}</span>
              </div>
              <p className="tnum mt-1 text-xs text-muted-foreground">Proyeksi akhir bulan: <b className={r.proyeksiAkhirBulan > r.anggaran ? "text-expense" : "text-foreground"}>{formatRupiah(r.proyeksiAkhirBulan)}</b></p>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="Belum ada anggaran bulan ini" desc="Tetapkan anggaran per kategori agar pengeluaran lebih terkendali." action={<button onClick={() => setOpen({ categoryId: expenseCats[0]?.id ?? 0, anggaran: 0, ambang: 80 })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Buat anggaran</button>} />}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(null)} />
          <div className="relative w-full max-w-sm rounded-t-2xl border bg-card p-4 shadow-2xl animate-fade-in sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between"><span className="font-display font-semibold">Atur Anggaran</span><button onClick={() => setOpen(null)}><X size={18} /></button></div>
            <label className="text-xs font-medium text-muted-foreground">Kategori
              <select value={open.categoryId} onChange={(e) => setOpen({ ...open, categoryId: Number(e.target.value) })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">Jumlah anggaran (Rp)
              <input inputMode="numeric" defaultValue={open.anggaran || ""} onChange={(e) => setOpen({ ...open, anggaran: parseRupiahInput(e.target.value) })} placeholder="0" className="tnum mt-1 w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold" />
            </label>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">Ambang peringatan: {open.ambang}%
              <input type="range" min={50} max={100} step={5} value={open.ambang} onChange={(e) => setOpen({ ...open, ambang: Number(e.target.value) })} className="mt-1 w-full" />
            </label>
            <button onClick={save} disabled={pending || open.anggaran <= 0} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
          </div>
        </div>
      )}
    </div>
  );
}
