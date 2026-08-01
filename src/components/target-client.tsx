"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, PiggyBank, Pencil, Trash2 } from "lucide-react";
import { formatRupiah, formatPercent, parseRupiahInput } from "@/lib/format";
import { fmtTanggal, daysUntil, todayISO } from "@/lib/dates";
import { colorHex } from "@/lib/colors";
import { Card, ProgressBar, EmptyState, Badge } from "@/components/ui";
import { simpanTarget, setorTarget, hapusTarget } from "@/lib/actions";

type Goal = { id: number; nama: string; jumlahTarget: number; terkumpul: number; tanggalTarget: string | null; warna: string; status: string; perBulan: number; walletId: number | null };
type WOpt = { id: number; nama: string };

export function TargetClient({ secret, goals, wallets }: { secret: string; goals: Goal[]; wallets: WOpt[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<null | Goal>(null);
  const [setor, setSetor] = useState<null | Goal>(null);
  const [pending, start] = useTransition();

  function del(g: Goal) {
    if (!confirm(`Hapus target "${g.nama}"? Setoran yang sudah tercatat sebagai transaksi tetap ada di halaman Transaksi.`)) return;
    start(async () => { await hapusTarget(g.id); router.refresh(); });
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Target Menabung</h1>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus size={15} /> Target</button>
      </div>
      {goals.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = g.jumlahTarget > 0 ? (g.terkumpul / g.jumlahTarget) * 100 : 0;
            const dd = g.tanggalTarget ? daysUntil(g.tanggalTarget) : null;
            return (
              <Card key={g.id} style={{ borderTopColor: colorHex(g.warna), borderTopWidth: 3 } as any}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold">{g.nama}</span>
                  <div className="flex items-center gap-1.5">
                    {g.status === "tercapai" ? <Badge tone="income">Tercapai 🎉</Badge> : dd !== null && <Badge tone={dd < 0 ? "expense" : "muted"}>{dd < 0 ? "Lewat tempo" : `${dd} hari lagi`}</Badge>}
                    <button aria-label="Ubah" onClick={() => setEdit(g)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil size={14} /></button>
                    <button aria-label="Hapus" onClick={() => del(g)} className="rounded p-1 text-expense hover:bg-expense/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="tnum font-display text-xl font-bold">{formatRupiah(g.terkumpul)}<span className="text-sm font-normal text-muted-foreground"> / {formatRupiah(g.jumlahTarget)}</span></p>
                <div className="mt-2"><ProgressBar value={pct} tone="primary" /></div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{formatPercent(pct, 0)}</span>
                  {g.tanggalTarget && <span>Target {fmtTanggal(g.tanggalTarget)}</span>}
                </div>
                {g.status !== "tercapai" && g.perBulan > 0 && <p className="tnum mt-2 rounded-md bg-primary/10 px-2 py-1.5 text-xs text-primary">Perlu menabung <b>{formatRupiah(g.perBulan)}</b>/bulan untuk capai tepat waktu.</p>}
                {g.status !== "tercapai" && <button onClick={() => setSetor(g)} className="mt-3 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"><PiggyBank size={14} /> Setor cepat</button>}
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title="Belum ada target" desc="Buat target menabung, misal 'Dana Darurat' atau 'Liburan'." action={<button onClick={() => setAddOpen(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Buat target</button>} />}

      {addOpen && <GoalForm onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); router.refresh(); }} />}
      {edit && <GoalForm edit={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); router.refresh(); }} />}
      {setor && <Setor goal={setor} wallets={wallets} onClose={() => setSetor(null)} onDone={() => { setSetor(null); router.refresh(); }} />}
    </div>
  );
}
function GoalForm({ edit, onClose, onDone }: { edit?: Goal; onClose: () => void; onDone: () => void }) {
  const [nama, setNama] = useState(edit?.nama ?? "");
  const [target, setTarget] = useState(edit?.jumlahTarget ?? 0);
  const [tgl, setTgl] = useState(edit?.tanggalTarget ?? "");
  const [warna, setWarna] = useState(edit?.warna ?? "violet");
  const [err, setErr] = useState(""); const [pending, start] = useTransition();
  const colors = ["violet", "emerald", "amber", "sky", "pink", "teal"];
  function save() {
    start(async () => {
      const res = await simpanTarget({ nama, jumlahTarget: target, tanggalTarget: tgl || null, warna, walletId: null }, edit?.id);
      if (res.ok) onDone(); else setErr(res.error);
    });
  }
  return (
    <ModalT title={edit ? "Ubah Target" : "Buat Target"} onClose={onClose}>
      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama target" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <input inputMode="numeric" defaultValue={edit?.jumlahTarget || ""} onChange={(e) => setTarget(parseRupiahInput(e.target.value))} placeholder="Jumlah target (Rp)" className="tnum mt-3 w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold" />
      <label className="mt-3 block text-xs text-muted-foreground">Target tanggal (opsional)<input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label>
      <div className="mt-3 flex gap-2">{colors.map((c) => <button key={c} onClick={() => setWarna(c)} className={`h-8 w-8 rounded-full ${warna === c ? "ring-2 ring-offset-2 ring-offset-card" : ""}`} style={{ background: colorHex(c) }} />)}</div>
      {err && <p className="mt-2 text-sm text-expense">{err}</p>}
      <button onClick={save} disabled={pending || !nama || target <= 0} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
    </ModalT>
  );
}
function Setor({ goal, wallets, onClose, onDone }: { goal: Goal; wallets: WOpt[]; onClose: () => void; onDone: () => void }) {
  const opsi = wallets.filter((w) => w.id !== goal.walletId);
  const [jumlah, setJumlah] = useState(0); const [walletId, setWalletId] = useState(opsi[0]?.id ?? 0);
  const [tanggal, setTanggal] = useState(todayISO()); const [err, setErr] = useState(""); const [pending, start] = useTransition();
  function save() {
    start(async () => {
      const res = await setorTarget({ goalId: goal.id, tanggal, jumlah, walletId });
      if (res.ok) onDone(); else setErr(res.error);
    });
  }
  return (
    <ModalT title={`Setor — ${goal.nama}`} onClose={onClose}>
      <input inputMode="numeric" onChange={(e) => setJumlah(parseRupiahInput(e.target.value))} placeholder="Jumlah setor (Rp)" className="tnum w-full rounded-md border bg-background px-3 py-2 text-lg font-semibold" />
      <select value={walletId} onChange={(e) => setWalletId(Number(e.target.value))} className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm">{opsi.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}</select>
      <p className="mt-2 text-xs text-muted-foreground">Uang dipindahkan dari dompet di atas ke dompet target <b>{goal.nama}</b> (tercatat sebagai transfer).</p>
      <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm" />
      {err && <p className="mt-2 text-sm text-expense">{err}</p>}
      <button onClick={save} disabled={pending || jumlah <= 0} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
    </ModalT>
  );
}
function ModalT({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
