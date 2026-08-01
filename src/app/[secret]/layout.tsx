import { Shell } from "@/components/shell";
import { getWallets, getCategories, getDebts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SecretLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const [wallets, categories, debts] = await Promise.all([getWallets(), getCategories(), getDebts()]);
  const wOpts = wallets.filter((w) => !w.isArchived).map((w) => ({ id: w.id, nama: w.nama, warna: w.warna, tipe: w.tipe }));
  const cOpts = categories.filter((c) => !c.isArchived).map((c) => ({ id: c.id, nama: c.nama, tipe: c.tipe, warna: c.warna }));
  const dOpts = debts.filter((d) => d.status !== "lunas").map((d) => ({ id: d.id, tipe: d.tipe, namaPihak: d.namaPihak }));
  return <Shell secret={secret} wallets={wOpts} categories={cOpts} debts={dOpts}>{children}</Shell>;
}
