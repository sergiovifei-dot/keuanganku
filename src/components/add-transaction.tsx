"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Delete, Loader2, Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { colorHex } from "@/lib/colors";
import { simpanTransaksi, updateTransaksi } from "@/lib/actions";

export type WOpt = { id: number; nama: string; warna: string; tipe: string };
export type COpt = { id: number; nama: string; tipe: string; warna: string };
export type DOpt = { id: number; tipe: string; namaPihak: string };
type Tipe = "expense" | "income" | "transfer";

export type EditTx = {
  id: number; tipe: Tipe; jumlah: number; walletId: number | null;
  walletTujuanId: number | null; categoryId: number | null; tanggal: string; catatan: string; debtId?: number | null;
};

export function AddTransaction({ secret, wallets, categories, debts = [], onClose, edit }: {
  secret: string; wallets: WOpt[]; categories: COpt[]; debts?: DOpt[]; onClose: () => void; edit?: EditTx;
}) {
  const router = useRouter();
  const [tipe, setTipe] = useState<Tipe>(edit?.tipe ?? "expense");
  const [nominal, setNominal] = useState(edit?.jumlah ?? 0);
  const [walletId, setWalletId] = useState<number | null>(edit?.walletId ?? wallets[0]?.id ?? null);
  const [walletTujuanId, setWalletTujuanId] = useState<number | null>(edit?.walletTujuanId ?? wallets[1]?.id ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(edit?.categoryId ?? null);
  const [debtId, setDebtId] = useState<number | null>(edit?.debtId ?? null);
  const [tanggal, setTanggal] = useState(edit?.tanggal ?? todayISO());
  const [catatan, setCatatan] = useState(edit?.catatan ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const cats = categories.filter((c) => c.tipe === (tipe === "income" ? "income" : "expense"));
  const selCat = categories.find((c) => c.id === categoryId);
  const linkHutang = tipe === "expense" && !!selCat && selCat.nama.toLowerCase().includes("hutang");
  const linkPiutang = tipe === "income" && !!selCat && selCat.nama.toLowerCase().includes("piutang");
  const showDebt = linkHutang || linkPiutang;
  const debtOptions = debts.filter((d) => d.tipe === (linkHutang ? "hutang" : "piutang"));

  function tapKey(k: string) {
    setError("");
    if (k === "del") setNominal((n) => Math.floor(n / 10));
    else if (k === "000") setNominal((n) => Math.min(n * 1000, 9_999_999_999));
    else setNominal((n) => Math.min(n * 10 + Number(k), 9_999_999_999));
  }

  function submit() {
    setError("");
    const payload = {
      tanggal, tipe, jumlah: nominal, walletId: walletId ?? 0,
      walletTujuanId: tipe === "transfer" ? walletTujuanId : null,
      categoryId: tipe === "transfer" ? null : categoryId,
      debtId: showDebt ? debtId : null, catatan, tags: [] as string[],
    };
    start(async () => {
      const res = edit ? await updateTransaksi(edit.id, payload) : await simpanTransaksi(payload);
      if (res.ok) { router.refresh(); onClose(); }
      else setError(res.error);
    });
  }

  const tipeColor = tipe === "income" ? "text-income" : tipe === "expense" ? "text-expense" : "text-transfer";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border bg-card shadow-2xl animate-fade-in sm:rounded-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-display font-semibold">{edit ? "Ubah Transaksi" : "Catat Transaksi"}</span>
          <button aria-label="Tutup" onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
            {(["expense", "income", "transfer"] as Tipe[]).map((t) => (
              <button key={t} onClick={() => { setTipe(t); setCategoryId(null); setDebtId(null); }}
                className={cn("rounded-md py-2 capitalize transition-colors",
                  tipe === t ? "bg-card shadow-sm" : "text-muted-foreground")}>
                {t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
              </button>
            ))}
          </div>

          <div className="mb-4 text-center">
            <div className={cn("tnum font-display text-4xl font-bold", nominal ? tipeColor : "text-muted-foreground")}>
              {formatRupiah(nominal)}
            </div>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              aria-label="Tanggal" className="mt-2 rounded-md border bg-background px-2 py-1 text-sm" />
          </div>

          {tipe !== "transfer" ? (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Kategori</p>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button key={c.id} onClick={() => { setCategoryId(c.id); setDebtId(null); }}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition-all",
                      categoryId === c.id ? "border-transparent text-white" : "hover:bg-muted")}
                    style={categoryId === c.id ? { background: colorHex(c.warna) } : {}}>
                    {c.nama}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Ke dompet</p>
              <select value={walletTujuanId ?? ""} onChange={(e) => setWalletTujuanId(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
              </select>
            </div>
          )}

          {/* Kaitkan ke hutang/piutang tertentu */}
          {showDebt && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary"><Link2 size={13} /> {linkHutang ? "Kurangi hutang ke" : "Kurangi piutang dari"}</p>
              {debtOptions.length ? (
                <select value={debtId ?? ""} onChange={(e) => setDebtId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">— Tidak dikaitkan</option>
                  {debtOptions.map((d) => <option key={d.id} value={d.id}>{d.namaPihak}</option>)}
                </select>
              ) : <p className="text-xs text-muted-foreground">Belum ada {linkHutang ? "hutang" : "piutang"} aktif. Tambah dulu di halaman Hutang.</p>}
            </div>
          )}

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{tipe === "transfer" ? "Dari dompet" : "Dompet"}</p>
            <select value={walletId ?? ""} onChange={(e) => setWalletId(Number(e.target.value))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
            </select>
          </div>

          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan (opsional)"
            className="mb-3 w-full rounded-md border bg-background px-3 py-2 text-sm" />

          {error && <p className="mb-2 rounded-md bg-expense/10 px-3 py-2 text-sm text-expense">{error}</p>}

          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","000","0","del"].map((k) => (
              <button key={k} onClick={() => tapKey(k)}
                className="grid h-12 place-items-center rounded-lg bg-muted text-lg font-semibold active:scale-95 hover:bg-muted/70">
                {k === "del" ? <Delete size={20} /> : k}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t p-4">
          <button onClick={submit} disabled={pending || nominal <= 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
            {pending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
