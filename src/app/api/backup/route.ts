import { NextResponse } from "next/server";
import { wajibSecret } from "@/lib/auth";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await wajibSecret();
  const db = getDb();
  const [wallets, categories, transactions, budgets, debts, debtPayments, savingsGoals, goalContributions, settings] =
    await Promise.all([
      db.select().from(schema.wallets), db.select().from(schema.categories),
      db.select().from(schema.transactions), db.select().from(schema.budgets),
      db.select().from(schema.debts), db.select().from(schema.debtPayments),
      db.select().from(schema.savingsGoals), db.select().from(schema.goalContributions),
      db.select().from(schema.settings),
    ]);
  const payload = { versi: 1, dibuat: new Date().toISOString(), wallets, categories, transactions, budgets, debts, debtPayments, savingsGoals, goalContributions, settings };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="keuanganku-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
