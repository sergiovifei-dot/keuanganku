import { getGoals, getContributions, getWallets } from "@/lib/queries";
import { targetPerBulan } from "@/lib/finance";
import { daysUntil } from "@/lib/dates";
import { TargetClient } from "@/components/target-client";

export const dynamic = "force-dynamic";

export default async function TargetPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const [goals, contribs, wallets] = await Promise.all([getGoals(), getContributions(), getWallets()]);
  const byGoal = new Map<number, number>();
  for (const c of contribs) byGoal.set(c.goalId, (byGoal.get(c.goalId) ?? 0) + c.jumlah);
  const g = goals.map((x) => {
    const terkumpul = byGoal.get(x.id) ?? 0;
    const sisa = Math.max(0, x.jumlahTarget - terkumpul);
    const dd = x.tanggalTarget ? Math.max(0, daysUntil(String(x.tanggalTarget))) : 0;
    return {
      id: x.id, nama: x.nama, jumlahTarget: x.jumlahTarget, terkumpul, tanggalTarget: x.tanggalTarget ? String(x.tanggalTarget) : null,
      warna: x.warna, status: x.status, perBulan: x.tanggalTarget ? targetPerBulan(sisa, dd) : 0, walletId: x.walletId,
    };
  });
  const wOpts = wallets.filter((w) => !w.isArchived).map((w) => ({ id: w.id, nama: w.nama }));
  return <TargetClient secret={secret} goals={g} wallets={wOpts} />;
}
