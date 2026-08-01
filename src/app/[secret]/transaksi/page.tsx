import { getTransactions, getWallets, getCategories, getDebts } from "@/lib/queries";
import { TransaksiClient } from "@/components/transaksi-client";

export const dynamic = "force-dynamic";
const PAGE = 30;

export default async function TransaksiPage({ params, searchParams }: {
  params: Promise<{ secret: string }>; searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { secret } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = {
    start: sp.start, end: sp.end, walletId: sp.walletId, categoryId: sp.categoryId, tipe: sp.tipe, q: sp.q, page,
  };
  const [rows, wallets, categories, debts] = await Promise.all([
    getTransactions({
      start: sp.start, end: sp.end,
      walletId: sp.walletId ? Number(sp.walletId) : undefined,
      categoryId: sp.categoryId ? Number(sp.categoryId) : undefined,
      tipe: sp.tipe, q: sp.q, limit: PAGE + 1, offset: (page - 1) * PAGE,
    }),
    getWallets(), getCategories(), getDebts(),
  ]);
  const hasMore = rows.length > PAGE;
  const txs = rows.slice(0, PAGE).map((t) => ({ ...t, tanggal: String(t.tanggal), tags: t.tags ?? [] })) as any;
  const wOpts = wallets.map((w) => ({ id: w.id, nama: w.nama, warna: w.warna, tipe: w.tipe }));
  const cOpts = categories.map((c) => ({ id: c.id, nama: c.nama, tipe: c.tipe, warna: c.warna }));
  const dOpts = debts.filter((d) => d.status !== "lunas").map((d) => ({ id: d.id, tipe: d.tipe, namaPihak: d.namaPihak }));
  return <TransaksiClient secret={secret} txs={txs} wallets={wOpts} categories={cOpts} debts={dOpts} filters={filters} hasMore={hasMore} />;
}
