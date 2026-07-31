import { Shell } from "@/components/shell";
import { getWallets, getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SecretLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const [wallets, categories] = await Promise.all([getWallets(), getCategories()]);
  const wOpts = wallets.filter((w) => !w.isArchived).map((w) => ({ id: w.id, nama: w.nama, warna: w.warna, tipe: w.tipe }));
  const cOpts = categories.filter((c) => !c.isArchived).map((c) => ({ id: c.id, nama: c.nama, tipe: c.tipe, warna: c.warna }));
  return <Shell secret={secret} wallets={wOpts} categories={cOpts}>{children}</Shell>;
}
