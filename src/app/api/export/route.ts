import { NextRequest, NextResponse } from "next/server";
import { wajibSecret } from "@/lib/auth";
import { getTransactions, getWallets, getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

function csvCell(v: string | number | null): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  await wajibSecret();
  const sp = req.nextUrl.searchParams;
  const [txs, wallets, cats] = await Promise.all([
    getTransactions({
      start: sp.get("start") || undefined, end: sp.get("end") || undefined,
      walletId: sp.get("walletId") ? Number(sp.get("walletId")) : undefined,
      categoryId: sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined,
      tipe: sp.get("tipe") || undefined, q: sp.get("q") || undefined, limit: 100000,
    }),
    getWallets(), getCategories(),
  ]);
  const wName = new Map(wallets.map((w) => [w.id, w.nama]));
  const cName = new Map(cats.map((c) => [c.id, c.nama]));
  const header = ["Tanggal", "Tipe", "Jumlah", "Dompet", "Dompet Tujuan", "Kategori", "Catatan", "Tags"];
  const lines = [header.join(",")];
  for (const t of txs) {
    lines.push([
      t.tanggal, t.tipe, t.jumlah, wName.get(t.walletId ?? -1) ?? "",
      t.walletTujuanId ? wName.get(t.walletTujuanId) ?? "" : "",
      t.categoryId ? cName.get(t.categoryId) ?? "" : "", t.catatan, (t.tags || []).join("|"),
    ].map(csvCell).join(","));
  }
  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transaksi-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
