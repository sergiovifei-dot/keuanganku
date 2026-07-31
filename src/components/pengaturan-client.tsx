"use client";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Copy, Check, Plus, X, Archive, ArchiveRestore, Download, Upload, Wallet2, Tag, ShieldCheck, Palette, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { formatRupiah, parseRupiahInput } from "@/lib/format";
import { colorHex } from "@/lib/colors";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { simpanWallet, arsipkanWallet, simpanKategori, hapusKategori, setArsipKategori, simpanPengaturan, restoreBackup } from "@/lib/actions";

type W = { id: number; nama: string; tipe: string; saldoAwal: number; warna: string; isArchived: boolean };
type C = { id: number; nama: string; tipe: string; warna: string; isArchived: boolean };
type S = { awalPeriodeBulan: number; pinAktif: boolean };
const COLORS = ["violet", "emerald", "amber", "sky", "pink", "teal", "orange", "lime", "red", "slate"];
const WTIPE = ["cash", "bank", "ewallet", "investasi", "lainnya"];

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function PengaturanClient({ secret, url, wallets, categories, settings }: {
  secret: string; url: string; wallets: W[]; categories: C[]; settings: S;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [wEdit, setWEdit] = useState<null | Partial<W>>(null);
  const [cForm, setCForm] = useState<null | { id?: number; tipe: string; nama: string; warna: string }>(null);
  const [showArsip, setShowArsip] = useState(false);
  const [awal, setAwal] = useState(settings.awalPeriodeBulan);
  const [pinAktif, setPinAktif] = useState(settings.pinAktif);
  const [pin, setPin] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function copy() { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  function saveWallet() {
    if (!wEdit) return;
    start(async () => {
      await simpanWallet({ nama: wEdit.nama ?? "", tipe: wEdit.tipe ?? "cash", saldoAwal: wEdit.saldoAwal ?? 0, warna: wEdit.warna ?? "violet", ikon: "wallet" }, wEdit.id);
      setWEdit(null); router.refresh();
    });
  }
  function saveCat() {
    if (!cForm || !cForm.nama) return;
    start(async () => {
      await simpanKategori({ nama: cForm.nama, tipe: cForm.tipe as any, warna: cForm.warna, ikon: "tag" }, cForm.id);
      setCForm(null); router.refresh();
    });
  }
  function delCat(c: C) {
    if (!confirm(`Hapus kategori "${c.nama}"? Jika sudah pernah dipakai transaksi, kategori akan diarsipkan (disembunyikan) agar riwayat tetap aman.`)) return;
    start(async () => {
      const res = await hapusKategori(c.id);
      setMsg(res.ok && (res as any).archived ? `Kategori "${c.nama}" diarsipkan karena masih dipakai riwayat.` : `Kategori "${c.nama}" dihapus.`);
      router.refresh();
    });
  }
  function restoreCat(c: C) { start(async () => { await setArsipKategori(c.id, false); router.refresh(); }); }
  function savePeriode() { start(async () => { await simpanPengaturan({ awalPeriodeBulan: awal }); setMsg("Awal periode disimpan."); router.refresh(); }); }
  async function togglePin(on: boolean) {
    if (on && pin.length !== 6) { setMsg("PIN harus 6 digit."); return; }
    const hash = on ? await sha256(pin) : null;
    start(async () => { await simpanPengaturan({ pinAktif: on, pinHash: hash }); setPinAktif(on); setMsg(on ? "PIN diaktifkan." : "PIN dinonaktifkan."); router.refresh(); });
  }
  function onRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!confirm("Restore akan MENGGANTI seluruh data saat ini. Lanjutkan?")) return;
    const reader = new FileReader();
    reader.onload = () => start(async () => { const res = await restoreBackup(String(reader.result)); setMsg(res.ok ? "Restore berhasil." : res.error); router.refresh(); });
    reader.readAsText(f);
  }

  const arsipCats = categories.filter((c) => c.isArchived);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Pengaturan</h1>
      {msg && <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</div>}

      <section>
        <SectionTitle>URL Rahasia</SectionTitle>
        <Card>
          <p className="text-xs text-muted-foreground">Simpan baik-baik. Siapa pun dengan tautan ini bisa mengakses datamu.</p>
          <div className="mt-2 flex gap-2">
            <input readOnly value={url} className="tnum flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm" />
            <button onClick={copy} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Tersalin" : "Salin"}</button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Tampilan</SectionTitle>
        <Card className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><Palette size={16} /> Mode gelap</span>
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
            {["light", "dark", "system"].map((t) => <button key={t} onClick={() => setTheme(t)} className={`rounded-md px-2.5 py-1 capitalize ${theme === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{t === "light" ? "Terang" : t === "dark" ? "Gelap" : "Sistem"}</button>)}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Awal Periode Bulan</SectionTitle>
        <Card className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><CalendarClock size={16} /> Mulai tanggal</span>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={28} value={awal} onChange={(e) => setAwal(Math.min(28, Math.max(1, Number(e.target.value))))} className="tnum w-16 rounded-md border bg-background px-2 py-1.5 text-sm" />
            <button onClick={savePeriode} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Simpan</button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle aksi={<button onClick={() => setWEdit({})} className="flex items-center gap-1 text-sm font-medium text-primary"><Plus size={14} /> Tambah</button>}><span className="flex items-center gap-1.5"><Wallet2 size={14} /> Dompet</span></SectionTitle>
        <Card className="divide-y p-0">
          {wallets.map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-2.5">
              <i className="h-3 w-3 rounded-full" style={{ background: colorHex(w.warna) }} />
              <div className="flex-1"><p className="text-sm font-medium">{w.nama} {w.isArchived && <Badge>arsip</Badge>}</p><p className="tnum text-xs text-muted-foreground">{w.tipe} · saldo awal {formatRupiah(w.saldoAwal)}</p></div>
              <button onClick={() => setWEdit(w)} className="text-xs font-medium text-primary">Ubah</button>
              <button onClick={() => start(async () => { await arsipkanWallet(w.id, !w.isArchived); router.refresh(); })} className="text-muted-foreground hover:text-foreground"><Archive size={14} /></button>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle><span className="flex items-center gap-1.5"><Tag size={14} /> Kategori</span></SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["expense", "income"] as const).map((tp) => (
            <Card key={tp} className="p-0">
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm font-semibold">{tp === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
                <button onClick={() => setCForm({ tipe: tp, nama: "", warna: "violet" })} className="flex items-center gap-1 text-sm font-medium text-primary"><Plus size={14} /> Tambah</button>
              </div>
              <div className="divide-y border-t">
                {categories.filter((c) => c.tipe === tp && !c.isArchived).map((c) => (
                  <div key={c.id} className="group flex items-center gap-2 px-4 py-2">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: colorHex(c.warna) }} />
                    <span className="flex-1 text-sm">{c.nama}</span>
                    <button aria-label="Ubah" onClick={() => setCForm({ id: c.id, tipe: c.tipe, nama: c.nama, warna: c.warna })} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil size={13} /></button>
                    <button aria-label="Hapus" onClick={() => delCat(c)} className="rounded p-1 text-expense hover:bg-expense/10"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {arsipCats.length > 0 && (
          <div className="mt-3">
            <button onClick={() => setShowArsip((v) => !v)} className="text-xs font-medium text-muted-foreground hover:text-foreground">{showArsip ? "Sembunyikan" : "Lihat"} kategori diarsipkan ({arsipCats.length})</button>
            {showArsip && (
              <Card className="mt-2 divide-y p-0">
                {arsipCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-4 py-2">
                    <i className="h-2.5 w-2.5 rounded-full opacity-50" style={{ background: colorHex(c.warna) }} />
                    <span className="flex-1 text-sm text-muted-foreground">{c.nama} <Badge>{c.tipe === "expense" ? "pengeluaran" : "pemasukan"}</Badge></span>
                    <button onClick={() => restoreCat(c)} className="flex items-center gap-1 rounded p-1 text-xs font-medium text-primary hover:bg-primary/10"><ArchiveRestore size={13} /> Pulihkan</button>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </section>

      <section>
        <SectionTitle><span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Kunci PIN (opsional)</span></SectionTitle>
        <Card>
          <p className="text-xs text-muted-foreground">Tambahan keamanan 6 digit saat membuka aplikasi. {pinAktif ? "Saat ini AKTIF." : "Saat ini nonaktif."}</p>
          {!pinAktif ? (
            <div className="mt-2 flex gap-2">
              <input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="6 digit PIN" className="tnum flex-1 rounded-md border bg-background px-3 py-2 text-sm tracking-widest" />
              <button onClick={() => togglePin(true)} disabled={pending} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Aktifkan</button>
            </div>
          ) : <button onClick={() => togglePin(false)} className="mt-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">Nonaktifkan PIN</button>}
        </Card>
      </section>

      <section>
        <SectionTitle>Backup Data</SectionTitle>
        <Card className="flex flex-wrap gap-2">
          <a href="/api/backup" className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Download size={15} /> Ekspor JSON</a>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Upload size={15} /> Restore JSON</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onRestore} />
        </Card>
      </section>

      {wEdit && (
        <ModalP title={wEdit.id ? "Ubah Dompet" : "Tambah Dompet"} onClose={() => setWEdit(null)}>
          <input defaultValue={wEdit.nama} onChange={(e) => setWEdit({ ...wEdit, nama: e.target.value })} placeholder="Nama dompet" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <select defaultValue={wEdit.tipe ?? "cash"} onChange={(e) => setWEdit({ ...wEdit, tipe: e.target.value })} className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm">{WTIPE.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <input inputMode="numeric" defaultValue={wEdit.saldoAwal || ""} onChange={(e) => setWEdit({ ...wEdit, saldoAwal: parseRupiahInput(e.target.value) })} placeholder="Saldo awal (Rp)" className="tnum mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">{COLORS.map((c) => <button key={c} onClick={() => setWEdit({ ...wEdit, warna: c })} className={`h-7 w-7 rounded-full ${wEdit.warna === c ? "ring-2 ring-offset-2 ring-offset-card" : ""}`} style={{ background: colorHex(c) }} />)}</div>
          <button onClick={saveWallet} disabled={pending || !wEdit.nama} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
        </ModalP>
      )}
      {cForm && (
        <ModalP title={`${cForm.id ? "Ubah" : "Tambah"} Kategori ${cForm.tipe === "expense" ? "Pengeluaran" : "Pemasukan"}`} onClose={() => setCForm(null)}>
          <input defaultValue={cForm.nama} onChange={(e) => setCForm({ ...cForm, nama: e.target.value })} placeholder="Nama kategori" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">{COLORS.map((c) => <button key={c} onClick={() => setCForm({ ...cForm, warna: c })} className={`h-7 w-7 rounded-full ${cForm.warna === c ? "ring-2 ring-offset-2 ring-offset-card" : ""}`} style={{ background: colorHex(c) }} />)}</div>
          <button onClick={saveCat} disabled={pending || !cForm.nama} className="mt-4 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">Simpan</button>
        </ModalP>
      )}
    </div>
  );
}
function ModalP({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
