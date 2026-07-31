import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { secretCocok } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DDL = [
  `CREATE TABLE IF NOT EXISTS wallets (id serial PRIMARY KEY, nama text NOT NULL, tipe text NOT NULL DEFAULT 'cash', saldo_awal bigint NOT NULL DEFAULT 0, warna text NOT NULL DEFAULT 'violet', ikon text NOT NULL DEFAULT 'wallet', urutan integer NOT NULL DEFAULT 0, is_archived boolean NOT NULL DEFAULT false, created_at timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS categories (id serial PRIMARY KEY, nama text NOT NULL, tipe text NOT NULL, parent_id integer, ikon text NOT NULL DEFAULT 'tag', warna text NOT NULL DEFAULT 'violet', is_archived boolean NOT NULL DEFAULT false)`,
  `CREATE TABLE IF NOT EXISTS transactions (id serial PRIMARY KEY, tanggal date NOT NULL, tipe text NOT NULL, jumlah bigint NOT NULL, wallet_id integer, wallet_tujuan_id integer, category_id integer, catatan text NOT NULL DEFAULT '', tags text[] NOT NULL DEFAULT '{}', attachment_url text, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS tx_tanggal_idx ON transactions (tanggal)`,
  `CREATE INDEX IF NOT EXISTS tx_wallet_idx ON transactions (wallet_id)`,
  `CREATE INDEX IF NOT EXISTS tx_category_idx ON transactions (category_id)`,
  `CREATE TABLE IF NOT EXISTS budgets (id serial PRIMARY KEY, category_id integer NOT NULL, periode text NOT NULL, jumlah_anggaran bigint NOT NULL, ambang_alert integer NOT NULL DEFAULT 80, is_recurring boolean NOT NULL DEFAULT false)`,
  `CREATE INDEX IF NOT EXISTS budget_periode_idx ON budgets (periode)`,
  `CREATE INDEX IF NOT EXISTS budget_cat_idx ON budgets (category_id)`,
  `CREATE TABLE IF NOT EXISTS debts (id serial PRIMARY KEY, tipe text NOT NULL, nama_pihak text NOT NULL, jumlah_pokok bigint NOT NULL, tanggal_mulai date NOT NULL, tanggal_jatuh_tempo date, bunga_persen integer, status text NOT NULL DEFAULT 'aktif', catatan text NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS debt_payments (id serial PRIMARY KEY, debt_id integer NOT NULL, tanggal date NOT NULL, jumlah bigint NOT NULL, wallet_id integer, catatan text NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS savings_goals (id serial PRIMARY KEY, nama text NOT NULL, jumlah_target bigint NOT NULL, tanggal_target date, wallet_id integer, warna text NOT NULL DEFAULT 'violet', ikon text NOT NULL DEFAULT 'target', status text NOT NULL DEFAULT 'aktif')`,
  `CREATE TABLE IF NOT EXISTS goal_contributions (id serial PRIMARY KEY, goal_id integer NOT NULL, tanggal date NOT NULL, jumlah bigint NOT NULL, wallet_id integer)`,
  `CREATE TABLE IF NOT EXISTS recurring_transactions (id serial PRIMARY KEY, nama text NOT NULL, tipe text NOT NULL, jumlah bigint NOT NULL, category_id integer, wallet_id integer, frekuensi text NOT NULL DEFAULT 'bulanan', tanggal_mulai date NOT NULL, tanggal_berakhir date, tanggal_eksekusi_berikutnya date NOT NULL, is_active boolean NOT NULL DEFAULT true)`,
  `CREATE TABLE IF NOT EXISTS settings (id serial PRIMARY KEY, mata_uang text NOT NULL DEFAULT 'IDR', awal_periode_bulan integer NOT NULL DEFAULT 1, tema text NOT NULL DEFAULT 'system', pin_hash text, pin_aktif boolean NOT NULL DEFAULT false)`,
];

const DOMPET = [
  { nama: "Tunai", tipe: "cash", warna: "emerald", ikon: "banknote", urutan: 1 },
  { nama: "Bank BCA", tipe: "bank", warna: "sky", ikon: "landmark", urutan: 2 },
  { nama: "GoPay", tipe: "ewallet", warna: "teal", ikon: "smartphone", urutan: 3 },
  { nama: "Rekening Tabungan", tipe: "bank", warna: "violet", ikon: "piggy-bank", urutan: 4 },
];
const EXPENSE: [string, string, string][] = [
  ["Makan & Minum", "utensils", "orange"], ["Transportasi", "car", "sky"], ["Belanja Harian", "shopping-cart", "amber"],
  ["Tagihan & Utilitas", "receipt", "violet"], ["Kesehatan", "heart-pulse", "pink"], ["Pendidikan", "graduation-cap", "teal"],
  ["Hiburan", "gamepad-2", "lime"], ["Donasi & Zakat", "hand-heart", "emerald"], ["Cicilan", "credit-card", "red"],
  ["Asuransi", "shield", "slate"], ["Lain-lain", "ellipsis", "slate"],
];
const INCOME: [string, string, string][] = [
  ["Gaji", "wallet", "emerald"], ["Bonus & THR", "gift", "amber"], ["Bisnis Sampingan", "store", "sky"],
  ["Hasil Investasi", "trending-up", "violet"], ["Hadiah", "party-popper", "pink"], ["Lain-lain", "ellipsis", "slate"],
];

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secretCocok(secret)) return new NextResponse("Not found", { status: 404 });
  const db = getDb();
  try {
    for (const stmt of DDL) await db.execute(sql.raw(stmt));
    const existing = await db.select().from(schema.wallets).limit(1);
    let seeded = false;
    if (existing.length === 0) {
      await db.insert(schema.wallets).values(DOMPET);
      await db.insert(schema.categories).values([
        ...EXPENSE.map(([nama, ikon, warna]) => ({ nama, tipe: "expense", ikon, warna })),
        ...INCOME.map(([nama, ikon, warna]) => ({ nama, tipe: "income", ikon, warna })),
      ]);
      await db.insert(schema.settings).values({ mataUang: "IDR", awalPeriodeBulan: 1, tema: "system" });
      seeded = true;
    }
    const url = `${req.nextUrl.protocol}//${req.nextUrl.host}/${secret}`;
    return new NextResponse(
      `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
      <body style="font-family:system-ui;background:#0f1226;color:#e5e7eb;display:grid;place-items:center;height:100vh;margin:0;text-align:center">
      <div><h1 style="color:#7c5cff">✅ Database siap!</h1>
      <p>${seeded ? "Tabel dibuat & data awal (dompet + kategori) sudah diisi." : "Tabel sudah ada. Aman."}</p>
      <p style="margin-top:24px">Buka aplikasimu:</p>
      <a href="${url}" style="display:inline-block;margin-top:8px;background:#7c5cff;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">Buka Keuanganku →</a>
      </div></body>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e: any) {
    return new NextResponse("Setup gagal: " + (e?.message ?? "unknown"), { status: 500 });
  }
}
