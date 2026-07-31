"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Pencil, Copy, Download, Filter, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { fmtTanggalPendek } from "@/lib/dates";
import { colorHex } from "@/lib/colors";
import { Card, Badge, EmptyState } from "@/components/ui";
import { AddTransaction, type WOpt, type COpt, type EditTx } from "@/components/add-transaction";
import { hapusTransaksi, simpanTransaksi } from "@/lib/actions";

type Tx = {
  id: number; tanggal: string; tipe: "income" | "expense" | "transfer"; jumlah: number;
  walletId: number | null; walletTujuanId: number | null; categoryId: number | null; catatan: string; tags: string[];
};
type Filters = { start?: string; end?: string; walletId?: string; categoryId?: string; tipe?: string; q?: string; page: number };

export function TransaksiClient({ secret, txs, wallets, categories, filters, hasMore }: {
  secret: string; txs: Tx[]; wallets: WOpt[]; categories: COpt[]; filters: Filters; hasMore: boolean;
}) {
  const router = useRouter();
  const base = `/${secret}/transaksi`;
  const [edit, setEdit] = useState<EditTx | null>(null);
  const [q, setQ] = useState(filters.q ?? "");
  const [showFilter, setShowFilter] = useState(false);
  const [pending, start] = useTransition();
  const wName = new Map(wallets.map((w) => [w.id, w]));
  const cName = new Map(categories.map((c) => [c.id, c]));

  function apply(next: Partial<Filters>) {
    const f = { ...filters, ...next };
    const p = new URLSearchParams();
    if (f.start) p.set("start", f.start); if (f.end) p.set("end", f.end);
    if (f.walletId) p.set("walletId", f.walletId); if (f.categoryId) p.set("categoryId", f.categoryId);
    if (f.tipe) p.set("tipe", f.tipe); if (f.q) p.set("q", f.q);
    if (next.page) p.set("page", String(next.page)); else if (f.page && !("page" in next)) p.set("page", String(f.page));
    router.push(`${base}?${p.toString()}`);
  }
  function del(id: number) {
    if (!confirm("Hapus transaksi ini?")) return;
    start(async () => { await hapusTransaksi(id); router.refresh(); });
  }
  function dup(t: Tx) {
    start(async () => {
      await simpanTransaksi({ tanggal: t.tanggal, tipe: t.tipe, jumlah: t.jumlah, walletId: t.walletId ?? 0, walletTujuanId: t.walletTujuanId, categoryId: t.categoryId, catatan: t.catatan, tags: t.tags });
      router.refresh();
    });
  }
  const exportUrl = () => {
    const p = new URLSearchParams();
    if (filters.start) p.set("start", filters.start); if (filters.end) p.set("end", filters.end);
    if (filters.walletId) p.set("walletId", filters.walletId); if (filters.categoryId) p.set("categoryId", filters.categoryId);
    if (filters.tipe) p.set("tipe", filters.tipe); if (filters.q) p.set("q", filters.q);
    return `/api/export?${p.toString()}`;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Transaksi</h1>
        <a href={exportUrl()} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Download size={15} /> Ekspor CSV</a>
      </div>

      <div className="flex gap-2">
        <form onSubmit={(e) => { e.preventDefault(); apply({ q, page: 1 }); }} className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari catatan / tag…"
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm" />
        </form>
        <button onClick={() => setShowFilter((v) => !v)} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Filter size={15} /> Filter</button>
      </div>

      {showFilter && (
        <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="text-xs font-medium text-muted-foreground">Dari<input type="date" defaultValue={filters.start} onChange={(e) => apply({ start: e.target.value, page: 1 })} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" /></label>
          <label className="text-xs font-medium text-muted-foreground">Sampai<input type="date" defaultValue={filters.end} onChange={(e) => apply({ end: e.target.value, page: 1 })} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" /></label>
          <label className="text-xs font-medium text-muted-foreground">Dompet<select defaultValue={filters.walletId ?? ""} onChange={(e) => apply({ walletId: e.target.value, page: 1 })} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"><option value="">Semua</option>{wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}</select></label>
          <label className="text-xs font-medium text-muted-foreground">Tipe<select defaultValue={filters.tipe ?? ""} onChange={(e) => apply({ tipe: e.target.value, page: 1 })} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"><option value="">Semua</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option><option value="transfer">Transfer</option></select></label>
          <button onClick={() => router.push(base)} className="col-span-2 text-left text-sm font-medium text-primary md:col-span-4">Reset filter</button>
        </Card>
      )}

      {txs.length ? (
        <Card className="divide-y p-0">
          {txs.map((t) => {
            const cat = t.categoryId ? cName.get(t.categoryId) : null;
            const color = t.tipe === "transfer" ? "slate" : cat?.warna ?? "slate";
            const label = t.tipe === "transfer" ? `${wName.get(t.walletId ?? -1)?.nama ?? "?"} → ${wName.get(t.walletTujuanId ?? -1)?.nama ?? "?"}` : cat?.nama ?? "Lainnya";
            return (
              <div key={t.id} className="group flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: `${colorHex(color)}22` }}>
                  {t.tipe === "transfer" ? <ArrowLeftRight size={16} style={{ color: colorHex("slate") }} /> : <i className="h-2.5 w-2.5 rounded-full" style={{ background: colorHex(color) }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">{fmtTanggalPendek(t.tanggal)} · {wName.get(t.walletId ?? -1)?.nama ?? "?"}{t.catatan ? ` · ${t.catatan}` : ""}</p>
                </div>
                <span className={`tnum shrink-0 text-sm font-semibold ${t.tipe === "income" ? "text-income" : t.tipe === "expense" ? "text-expense" : "text-transfer"}`}>
                  {t.tipe === "income" ? "+" : t.tipe === "expense" ? "−" : ""}{formatRupiah(t.jumlah)}
                </span>
                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button aria-label="Ubah" onClick={() => setEdit({ id: t.id, tipe: t.tipe, jumlah: t.jumlah, walletId: t.walletId, walletTujuanId: t.walletTujuanId, categoryId: t.categoryId, tanggal: t.tanggal, catatan: t.catatan })} className="rounded p-1.5 hover:bg-muted"><Pencil size={14} /></button>
                  <button aria-label="Duplikat" onClick={() => dup(t)} className="rounded p-1.5 hover:bg-muted"><Copy size={14} /></button>
                  <button aria-label="Hapus" onClick={() => del(t.id)} className="rounded p-1.5 text-expense hover:bg-expense/10"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </Card>
      ) : <EmptyState title="Belum ada transaksi" desc="Tekan tombol Catat untuk menambah transaksi pertamamu, atau ubah filter." />}

      {(filters.page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={filters.page <= 1} onClick={() => apply({ page: filters.page - 1 })} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"><ChevronLeft size={15} /> Sebelumnya</button>
          <span className="text-sm text-muted-foreground">Hal. {filters.page}</span>
          <button disabled={!hasMore} onClick={() => apply({ page: filters.page + 1 })} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Berikutnya <ChevronRight size={15} /></button>
        </div>
      )}

      {edit && <AddTransaction secret={secret} wallets={wallets} categories={categories} edit={edit} onClose={() => setEdit(null)} />}
      {pending && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs text-background md:bottom-6">Menyimpan…</div>}
    </div>
  );
}
