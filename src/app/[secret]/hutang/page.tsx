import { getDebts, getDebtPayments, getWallets } from "@/lib/queries";
import { ringkasHutang, agingBucket } from "@/lib/finance";
import { daysUntil } from "@/lib/dates";
import { HutangClient } from "@/components/hutang-client";

export const dynamic = "force-dynamic";

export default async function HutangPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const [debts, payments, wallets] = await Promise.all([getDebts(), getDebtPayments(), getWallets()]);
  const payByDebt = new Map<number, number[]>();
  for (const p of payments) { const a = payByDebt.get(p.debtId) ?? []; a.push(p.jumlah); payByDebt.set(p.debtId, a); }
  const items = debts.map((d) => {
    const r = ringkasHutang(d.jumlahPokok, payByDebt.get(d.id) ?? []);
    const dd = d.tanggalJatuhTempo ? daysUntil(String(d.tanggalJatuhTempo)) : 999;
    return {
      id: d.id, tipe: d.tipe as "hutang" | "piutang", namaPihak: d.namaPihak, jumlahPokok: d.jumlahPokok,
      terbayar: r.terbayar, outstanding: r.outstanding, tanggalMulai: String(d.tanggalMulai),
      tanggalJatuhTempo: d.tanggalJatuhTempo ? String(d.tanggalJatuhTempo) : null,
      status: d.status, bucket: d.tanggalJatuhTempo ? agingBucket(dd) : "belum", catatan: d.catatan,
    };
  });
  const wOpts = wallets.filter((w) => !w.isArchived).map((w) => ({ id: w.id, nama: w.nama }));
  return <HutangClient secret={secret} items={items} wallets={wOpts} />;
}
