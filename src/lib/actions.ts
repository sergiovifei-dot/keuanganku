"use server";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { eq, or } from "drizzle-orm";
import { wajibSecret, appSecret } from "@/lib/auth";
import {
  transaksiSchema, walletSchema, kategoriSchema, anggaranSchema,
  hutangSchema, cicilanSchema, targetSchema, setoranSchema,
} from "@/lib/validation";
import { todayISO } from "@/lib/dates";

const { wallets, categories, transactions, budgets, debts, debtPayments, savingsGoals, goalContributions, settings } = schema;

function revAll() {
  for (const p of ["", "/transaksi", "/anggaran", "/hutang", "/target", "/laporan", "/pengaturan"]) {
    revalidatePath(`/${appSecret()}${p}`);
  }
}
type Result = { ok: true } | { ok: false; error: string };

// ---------------- Transaksi ----------------
export async function simpanTransaksi(raw: unknown): Promise<Result> {
  await wajibSecret();
  const p = transaksiSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  await db.insert(transactions).values({
    tanggal: d.tanggal, tipe: d.tipe, jumlah: d.jumlah,
    walletId: d.walletId, walletTujuanId: d.tipe === "transfer" ? d.walletTujuanId! : null,
    categoryId: d.tipe === "transfer" ? null : d.categoryId!, catatan: d.catatan, tags: d.tags,
  });
  revAll();
  return { ok: true };
}
export async function updateTransaksi(id: number, raw: unknown): Promise<Result> {
  await wajibSecret();
  const p = transaksiSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  await db.update(transactions).set({
    tanggal: d.tanggal, tipe: d.tipe, jumlah: d.jumlah, walletId: d.walletId,
    walletTujuanId: d.tipe === "transfer" ? d.walletTujuanId! : null,
    categoryId: d.tipe === "transfer" ? null : d.categoryId!, catatan: d.catatan, tags: d.tags,
    updatedAt: new Date(),
  }).where(eq(transactions.id, id));
  revAll();
  return { ok: true };
}
export async function hapusTransaksi(id: number): Promise<Result> {
  await wajibSecret();
  await getDb().delete(transactions).where(eq(transactions.id, id));
  revAll();
  return { ok: true };
}

// ---------------- Wallet ----------------
export async function simpanWallet(raw: unknown, id?: number): Promise<Result> {
  await wajibSecret();
  const p = walletSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const db = getDb();
  if (id) await db.update(wallets).set(p.data).where(eq(wallets.id, id));
  else await db.insert(wallets).values(p.data);
  revAll();
  return { ok: true };
}
export async function arsipkanWallet(id: number, arsip: boolean): Promise<Result> {
  await wajibSecret();
  await getDb().update(wallets).set({ isArchived: arsip }).where(eq(wallets.id, id));
  revAll();
  return { ok: true };
}

// ---------------- Kategori ----------------
export async function simpanKategori(raw: unknown, id?: number): Promise<Result> {
  await wajibSecret();
  const p = kategoriSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const db = getDb();
  if (id) await db.update(categories).set(p.data).where(eq(categories.id, id));
  else await db.insert(categories).values(p.data);
  revAll();
  return { ok: true };
}

// ---------------- Anggaran ----------------
export async function simpanAnggaran(raw: unknown): Promise<Result> {
  await wajibSecret();
  const p = anggaranSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  const existing = await db.select().from(budgets)
    .where(eq(budgets.categoryId, d.categoryId));
  const same = existing.find((b) => b.periode === d.periode);
  if (same) await db.update(budgets).set(d).where(eq(budgets.id, same.id));
  else await db.insert(budgets).values(d);
  revAll();
  return { ok: true };
}
export async function salinAnggaran(dariPeriode: string, kePeriode: string): Promise<Result> {
  await wajibSecret();
  const db = getDb();
  const src = await db.select().from(budgets).where(eq(budgets.periode, dariPeriode));
  for (const b of src) {
    const dst = (await db.select().from(budgets).where(eq(budgets.categoryId, b.categoryId)))
      .find((x) => x.periode === kePeriode);
    if (dst) await db.update(budgets).set({ jumlahAnggaran: b.jumlahAnggaran }).where(eq(budgets.id, dst.id));
    else await db.insert(budgets).values({ categoryId: b.categoryId, periode: kePeriode, jumlahAnggaran: b.jumlahAnggaran, ambangAlert: b.ambangAlert, isRecurring: b.isRecurring });
  }
  revAll();
  return { ok: true };
}
export async function hapusAnggaran(id: number): Promise<Result> {
  await wajibSecret();
  await getDb().delete(budgets).where(eq(budgets.id, id));
  revAll();
  return { ok: true };
}

// ---------------- Hutang & Piutang ----------------
export async function simpanHutang(raw: unknown, id?: number): Promise<Result> {
  await wajibSecret();
  const p = hutangSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  const val = { ...d, bungaPersen: d.bungaPersen ?? null, tanggalJatuhTempo: d.tanggalJatuhTempo ?? null };
  if (id) await db.update(debts).set(val).where(eq(debts.id, id));
  else await db.insert(debts).values(val);
  revAll();
  return { ok: true };
}
export async function bayarHutang(raw: unknown): Promise<Result> {
  await wajibSecret();
  const p = cicilanSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  const debt = (await db.select().from(debts).where(eq(debts.id, d.debtId)))[0];
  if (!debt) return { ok: false, error: "Data hutang tidak ditemukan" };
  await db.insert(debtPayments).values({ debtId: d.debtId, tanggal: d.tanggal, jumlah: d.jumlah, walletId: d.walletId, catatan: d.catatan });
  // Transaksi terkait: bayar hutang = uang keluar (expense); terima piutang = uang masuk (income)
  await db.insert(transactions).values({
    tanggal: d.tanggal, tipe: debt.tipe === "hutang" ? "expense" : "income",
    jumlah: d.jumlah, walletId: d.walletId, categoryId: null,
    catatan: `${debt.tipe === "hutang" ? "Bayar hutang" : "Terima piutang"}: ${debt.namaPihak}`, tags: ["hutang-piutang"],
  });
  // Update status lunas bila outstanding habis
  const pays = await db.select().from(debtPayments).where(eq(debtPayments.debtId, d.debtId));
  const total = pays.reduce((a, b) => a + b.jumlah, 0);
  if (total >= debt.jumlahPokok) await db.update(debts).set({ status: "lunas" }).where(eq(debts.id, d.debtId));
  revAll();
  return { ok: true };
}

// ---------------- Target Menabung ----------------
export async function simpanTarget(raw: unknown, id?: number): Promise<Result> {
  await wajibSecret();
  const p = targetSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  const goalVal = {
    nama: d.nama, jumlahTarget: d.jumlahTarget, tanggalTarget: d.tanggalTarget ?? null,
    warna: d.warna, ikon: d.ikon,
  };
  if (id) {
    // Pastikan target punya dompet terhubung (buat bila belum ada; kalau ada, samakan nama & warnanya).
    const existing = (await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)))[0];
    let walletId = existing?.walletId ?? null;
    if (!walletId) {
      const created = await db.insert(wallets)
        .values({ nama: d.nama, tipe: "investasi", warna: d.warna, ikon: "piggy-bank" })
        .returning({ id: wallets.id });
      walletId = created[0].id;
    } else {
      await db.update(wallets).set({ nama: d.nama, warna: d.warna }).where(eq(wallets.id, walletId));
    }
    await db.update(savingsGoals).set({ ...goalVal, walletId }).where(eq(savingsGoals.id, id));
  } else {
    // Target baru -> otomatis buat dompet khusus untuk menabung ke target ini.
    const created = await db.insert(wallets)
      .values({ nama: d.nama, tipe: "investasi", warna: d.warna, ikon: "piggy-bank" })
      .returning({ id: wallets.id });
    await db.insert(savingsGoals).values({ ...goalVal, walletId: created[0].id });
  }
  revAll();
  return { ok: true };
}
export async function setorTarget(raw: unknown): Promise<Result> {
  await wajibSecret();
  const p = setoranSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid" };
  const d = p.data;
  const db = getDb();
  const goal = (await db.select().from(savingsGoals).where(eq(savingsGoals.id, d.goalId)))[0];
  if (!goal) return { ok: false, error: "Target tidak ditemukan" };
  await db.insert(goalContributions).values({ goalId: d.goalId, tanggal: d.tanggal, jumlah: d.jumlah, walletId: d.walletId });
  // Bila target punya dompet tujuan -> catat transfer; jika tidak, tidak membuat transaksi.
  if (goal.walletId && goal.walletId !== d.walletId) {
    await db.insert(transactions).values({
      tanggal: d.tanggal, tipe: "transfer", jumlah: d.jumlah,
      walletId: d.walletId, walletTujuanId: goal.walletId, categoryId: null,
      catatan: `Setor target: ${goal.nama}`, tags: ["target"],
    });
  }
  const contribs = await db.select().from(goalContributions).where(eq(goalContributions.goalId, d.goalId));
  const total = contribs.reduce((a, b) => a + b.jumlah, 0);
  if (total >= goal.jumlahTarget) await db.update(savingsGoals).set({ status: "tercapai" }).where(eq(savingsGoals.id, d.goalId));
  revAll();
  return { ok: true };
}

// ---------------- Pengaturan ----------------
export async function simpanPengaturan(raw: { awalPeriodeBulan?: number; tema?: string; pinAktif?: boolean; pinHash?: string | null }): Promise<Result> {
  await wajibSecret();
  const db = getDb();
  const cur = (await db.select().from(settings).limit(1))[0];
  const val = {
    awalPeriodeBulan: raw.awalPeriodeBulan ?? cur?.awalPeriodeBulan ?? 1,
    tema: raw.tema ?? cur?.tema ?? "system",
    pinAktif: raw.pinAktif ?? cur?.pinAktif ?? false,
    pinHash: raw.pinHash !== undefined ? raw.pinHash : cur?.pinHash ?? null,
  };
  if (cur) await db.update(settings).set(val).where(eq(settings.id, cur.id));
  else await db.insert(settings).values({ mataUang: "IDR", ...val });
  revAll();
  return { ok: true };
}

// ---------------- Backup restore ----------------
export async function restoreBackup(json: string): Promise<Result> {
  await wajibSecret();
  let data: any;
  try { data = JSON.parse(json); } catch { return { ok: false, error: "File JSON tidak valid" }; }
  const db = getDb();
  try {
    await db.delete(goalContributions); await db.delete(savingsGoals);
    await db.delete(debtPayments); await db.delete(debts);
    await db.delete(budgets); await db.delete(transactions);
    await db.delete(categories); await db.delete(wallets);
    if (data.wallets?.length) await db.insert(wallets).values(data.wallets);
    if (data.categories?.length) await db.insert(categories).values(data.categories);
    if (data.transactions?.length) await db.insert(transactions).values(data.transactions);
    if (data.budgets?.length) await db.insert(budgets).values(data.budgets);
    if (data.debts?.length) await db.insert(debts).values(data.debts);
    if (data.debtPayments?.length) await db.insert(debtPayments).values(data.debtPayments);
    if (data.savingsGoals?.length) await db.insert(savingsGoals).values(data.savingsGoals);
    if (data.goalContributions?.length) await db.insert(goalContributions).values(data.goalContributions);
  } catch (e: any) {
    return { ok: false, error: "Gagal restore: " + (e?.message ?? "unknown") };
  }
  revAll();
  return { ok: true };
}

// ---------------- Hapus/Arsip Kategori ----------------
export async function hapusKategori(id: number): Promise<Result & { archived?: boolean }> {
  await wajibSecret();
  const db = getDb();
  const dipakaiTx = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.categoryId, id)).limit(1);
  const dipakaiBudget = await db.select({ id: budgets.id }).from(budgets).where(eq(budgets.categoryId, id)).limit(1);
  if (dipakaiTx.length > 0 || dipakaiBudget.length > 0) {
    // Masih dipakai riwayat -> arsipkan agar data lama tidak rusak.
    await db.update(categories).set({ isArchived: true }).where(eq(categories.id, id));
    revAll();
    return { ok: true, archived: true };
  }
  await db.delete(categories).where(eq(categories.id, id));
  revAll();
  return { ok: true };
}
export async function setArsipKategori(id: number, arsip: boolean): Promise<Result> {
  await wajibSecret();
  await getDb().update(categories).set({ isArchived: arsip }).where(eq(categories.id, id));
  revAll();
  return { ok: true };
}

// ---------------- Hapus Target ----------------
export async function hapusTarget(id: number): Promise<Result> {
  await wajibSecret();
  const db = getDb();
  const goal = (await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)))[0];
  await db.delete(goalContributions).where(eq(goalContributions.goalId, id));
  await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
  // Dompet target: hapus bila kosong (belum pernah dipakai transaksi); jika sudah ada uang/mutasi, biarkan tetap ada agar saldo tidak hilang.
  if (goal?.walletId) {
    const used = await db.select({ id: transactions.id }).from(transactions)
      .where(or(eq(transactions.walletId, goal.walletId), eq(transactions.walletTujuanId, goal.walletId))).limit(1);
    if (used.length === 0) await db.delete(wallets).where(eq(wallets.id, goal.walletId));
  }
  revAll();
  return { ok: true };
}

// ---------------- Hapus Hutang/Piutang ----------------
export async function hapusHutang(id: number): Promise<Result> {
  await wajibSecret();
  const db = getDb();
  await db.delete(debtPayments).where(eq(debtPayments.debtId, id));
  await db.delete(debts).where(eq(debts.id, id));
  revAll();
  return { ok: true };
}
