import "server-only";
import { getDb, schema } from "@/db";
import { and, gte, lte, eq, desc, sql } from "drizzle-orm";

const { wallets, categories, transactions, budgets, debts, debtPayments, savingsGoals, goalContributions, settings } = schema;

export async function getWallets() {
  const db = getDb();
  return db.select().from(wallets).orderBy(wallets.urutan, wallets.id);
}
export async function getCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(categories.tipe, categories.nama);
}
export async function getSettings() {
  const db = getDb();
  const rows = await db.select().from(settings).limit(1);
  return rows[0] ?? null;
}

export type TxRow = typeof transactions.$inferSelect;

export async function getTransactions(filter: {
  start?: string; end?: string; walletId?: number; categoryId?: number;
  tipe?: string; q?: string; limit?: number; offset?: number;
} = {}) {
  const db = getDb();
  const conds = [];
  if (filter.start) conds.push(gte(transactions.tanggal, filter.start));
  if (filter.end) conds.push(lte(transactions.tanggal, filter.end));
  if (filter.walletId) conds.push(eq(transactions.walletId, filter.walletId));
  if (filter.categoryId) conds.push(eq(transactions.categoryId, filter.categoryId));
  if (filter.tipe) conds.push(eq(transactions.tipe, filter.tipe));
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db.select().from(transactions).where(where)
    .orderBy(desc(transactions.tanggal), desc(transactions.id))
    .limit(filter.limit ?? 100).offset(filter.offset ?? 0);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    return rows.filter((r) => r.catatan.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q)));
  }
  return rows;
}

export async function getAllTransactions() {
  const db = getDb();
  return db.select().from(transactions).orderBy(desc(transactions.tanggal), desc(transactions.id));
}

export async function getBudgets(periode: string) {
  const db = getDb();
  return db.select().from(budgets).where(eq(budgets.periode, periode));
}
export async function getDebts() {
  const db = getDb();
  return db.select().from(debts).orderBy(desc(debts.id));
}
export async function getDebtPayments() {
  const db = getDb();
  return db.select().from(debtPayments).orderBy(desc(debtPayments.tanggal));
}
export async function getGoals() {
  const db = getDb();
  return db.select().from(savingsGoals).orderBy(desc(savingsGoals.id));
}
export async function getContributions() {
  const db = getDb();
  return db.select().from(goalContributions);
}
