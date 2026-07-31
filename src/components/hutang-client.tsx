"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatRupiah, parseRupiahInput } from "@/lib/format";
import { fmtTanggal, daysUntil, todayISO } from "@/lib/dates";
import { Card, ProgressBar, Badge, EmptyState } from "@/components/ui";
import { simpanHutang, bayarHutang } from "@/lib/actions";

type Item = {
  id: number; tipe: "hutang" | "piutang"; namaPihak: string; jumlahPokok: number; terbayar: number;
  outstanding: number; tanggalMulai: string; tanggalJatuhTempo: string | null; status: string; bucket: string; catatan: string;
};
type WOpt = { id: number; nama: string };

const BUCKETS = [["belum", "Belum jatuh tempo"], ["1-30", "1–30 hari"], ["31-60", "31–60 hari"], ["61-90", "61–90 hari"], [">90", ">90 hari"]];

export function HutangClient({ secret, items, wallets }: { secret: string; items: Item[]; wallets: WOpt[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"hutang" | "piutang">("hutang");
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<null | Item>(null);
  const [pending, start] = useTransition();

  const list = items.filter((i) => i.tipe === tab);
  const totalOut = list.filter((i) => i.status !== "lunas").reduce((a, i) => a + i.outstanding, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Hutang & Piutang</h1>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus size={15} /> Tambah</button>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
        {(["hutang", "piutang"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md py-2 capitalize ${tab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{t === "hutang" ? "Hutang (saya berutang)" : "Piutang (ke saya)"}</button>
        ))}
      </div>

      <Card className={tab === "hutang" ? "bg-expense/5" : "bg-income/5"}>
        <p className="text-xs text-muted-foreground">Total {tab} outstanding</p>
        <p className={`tnum mt-1 font-display text-2xl font-bold ${tab === "hutang" ? "text-expense" : "text-income"}`}>{formatRupiah(totalOut)}</p>
      </Card>

      {/* Aging */}
      <Card>
        <p className="mb-2 font-display text-sm font-semibold">Aging</p>
        <div className="grid grid-cols-5 gap-1 text-center">
          {BUCKETS.map(([key, label]) => {
            const sum = list.filter((i) => i.status !== "lunas" && i.bucket === key).reduce((a, i) => a + i.outstanding, 0);
            return <div key={key} className="rounded-md bg-muted p-2"><p className="text-[10px] text-muted-foreground">{label}</p><p className="tnum mt-1 text-xs font-semibold">{formatRupiah(sum)}</p></div>;
          })}
        </div>
      </Card>

      {list.length ? (
        <div className="space-y-3">
          {list.map((i) => {
            const dd = i.tanggalJatuhTempo ? daysUntil(i.tanggalJatuhTempo) : null;
            const pct = i.jumlahPokok > 0 ? (i.terbayar / i.jumlahPokok) * 100 : 0;
            const due7 = dd !== null && dd >= 0 && dd <= 7 && i.status !== "lunas";
            return (
              <Card key={i.id} className={due7 ? "border-c3/40" : ""}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{i.namaPihak}</p>
                    <p className="text-xs text-muted-foreground">Mulai {fmtTanggal(i.tanggalMulai)}{i.tanggalJatuhTempo ? ` · Jatuh tempo ${fmtTanggal(i.tanggalJatuhTempo)}` : ""}</p>
                  </div>
                  {i.status === "lunas" ? <Badge tone="income"><CheckCircle2 size={12} className="mr-1" /> Lunas</Badge>
                    : due7 ? <Badge tone="warn"><AlertTriangle size={12} className="mr-1" /> {dd === 0 ? "Hari ini" : `${dd} hari`}</Badge>
                    : <Badge tone="muted">{i.status}</Badge>}
                </div>
                <ProgressBar value={pct} tone={i.tipe === "hutang" ? "expense" : "income"} />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span className="tnum">Terbayar {formatRupiah(i.terbayar)} / {formatRupiah(i.jumlahPokok)}</span>
                  <span className="tnum font-medium text-foreground">Sisa {formatRupiah(i.outstanding)}</span>
                </div>
                {i.status !== "lunas" && <button onClick={() => setPayOpen(i)} className="mt-3 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"><Wallet size={14} /> Catat {i.tipe === "hutang" ? "pembayaran" : "penerimaan"}</button>}
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title={`Belum ada ${tab}`} desc="Catat hutang atau piutang agar tidak lupa jatuh tempo." action={<button onClick={() => setAddOpen(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Tambah</button>} />}

      {addOpen && <AddDebt secret={secret} defTipe={tab} onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); router.refresh(); }} />}
      {payOpen && <PayDebt item={payOpen} wallets={wallets} onClose={() => setPayOpen(null)} onDone={() => { setPayOpen(null); router.refresh(); }} />}
    </div>
  );
}

function AddDebt({ secret, defTipe, onClose, onDone }: { secret: string; defTipe: "hutang" | "piutang"; onClose: () => void; onDone: () => void }) {
  const [tipe, setTipe] = useState(defTipe);
  const [nama, setNama] = useState(""); const [pokok, setPokok] = useState(0);
  const [mulai, setMulai] = useState(todayISO()); const [jt, setJt] = useState("");
  const [err, setErr] = useState(""); const [pending, start] = useTransition();
  function save() {
    start(async () => {
      const res = await simpanHutang({ tipe, namaPihak: nama, jumlahPokok: pokok, tanggalMulai: mulai, tanggalJatuhTempo: jt || null, catatan: "" });
      if (res.ok) onDone(); else setErr(res.error);
    });
  }
  return (
    <Modal title="Tambah Hutang/Piutang" onClose={onClose}>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
        {(["hutang", "piutang"] as const).map((t) => <button key={t} onClick={() => setTipe(t)} className={`rounded-md py-1.5 capitalize ${tipe === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{t}</button>)}
      </div>
      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pihak" className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <input inputMode="numeric" onChange={(e) => setPokok(parseRupiahInput(e.target.value))} placeholder="Jumlah pokok (Rp)" className="tnum mt-3 w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-muted-foreground">Mulai<input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" /></label>
        <label className="text-xs text-muted-foreground">Jatuh tempo<input type="date" value={jt} onChange={(e) => setJt(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" /></label>
      </div>
      {err && <p className="mt-2 text-sm text-expense">{err}</p>}
      <button onClick={save} disabled={pending || !nama || pokok <= 0} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
    </Modal>
  );
}
function PayDebt({ item, wallets, onClose, onDone }: { item: Item; wallets: WOpt[]; onClose: () => void; onDone: () => void }) {
  const [jumlah, setJumlah] = useState(item.outstanding);
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? 0);
  const [tanggal, setTanggal] = useState(todayISO());
  const [err, setErr] = useState(""); const [pending, start] = useTransition();
  function save() {
    start(async () => {
      const res = await bayarHutang({ debtId: item.id, tanggal, jumlah, walletId, catatan: "" });
      if (res.ok) onDone(); else setErr(res.error);
    });
  }
  return (
    <Modal title={`${item.tipe === "hutang" ? "Bayar" : "Terima"} — ${item.namaPihak}`} onClose={onClose}>
      <input inputMode="numeric" defaultValue={item.outstanding} onChange={(e) => setJumlah(parseRupiahInput(e.target.value))} className="tnum w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold" />
      <select value={walletId} onChange={(e) => setWalletId(Number(e.target.value))} className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm">{wallets.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}</select>
      <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <p className="mt-2 text-xs text-muted-foreground">Otomatis membuat transaksi {item.tipe === "hutang" ? "pengeluaran" : "pemasukan"} di dompet terpilih.</p>
      {err && <p className="mt-2 text-sm text-expense">{err}</p>}
      <button onClick={save} disabled={pending || jumlah <= 0} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
    </Modal>
  );
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl border bg-card p-4 shadow-2xl animate-fade-in sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between"><span className="font-display font-semibold">{title}</span><button onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
