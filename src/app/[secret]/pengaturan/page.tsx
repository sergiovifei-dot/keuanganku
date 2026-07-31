import { headers } from "next/headers";
import { getWallets, getCategories, getSettings } from "@/lib/queries";
import { PengaturanClient } from "@/components/pengaturan-client";

export const dynamic = "force-dynamic";

export default async function PengaturanPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const url = `${proto}://${host}/${secret}`;
  const [wallets, categories, settings] = await Promise.all([getWallets(), getCategories(), getSettings()]);
  return <PengaturanClient
    secret={secret} url={url}
    wallets={wallets.map((w) => ({ id: w.id, nama: w.nama, tipe: w.tipe, saldoAwal: w.saldoAwal, warna: w.warna, isArchived: w.isArchived }))}
    categories={categories.map((c) => ({ id: c.id, nama: c.nama, tipe: c.tipe, warna: c.warna, isArchived: c.isArchived }))}
    settings={{ awalPeriodeBulan: settings?.awalPeriodeBulan ?? 1, pinAktif: settings?.pinAktif ?? false }} />;
}
