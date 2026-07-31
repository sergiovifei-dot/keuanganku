// ============================================================================
// Perhitungan keuangan inti — SEMUA fungsi murni (pure) & memakai integer rupiah.
// Diuji oleh tests/finance.test.ts
// ============================================================================

export type TxTipe = "income" | "expense" | "transfer";

export interface TxLike {
  tipe: TxTipe;
  jumlah: number;            // integer rupiah, selalu positif
  walletId: number | null;
  walletTujuanId?: number | null;
}

/**
 * Saldo satu dompet = saldo_awal
 *   + semua income ke dompet
 *   - semua expense dari dompet
 *   - transfer keluar (walletId)
 *   + transfer masuk (walletTujuanId)
 */
export function saldoDompet(saldoAwal: number, walletId: number, txs: TxLike[]): number {
  let saldo = saldoAwal;
  for (const t of txs) {
    if (t.tipe === "income" && t.walletId === walletId) saldo += t.jumlah;
    else if (t.tipe === "expense" && t.walletId === walletId) saldo -= t.jumlah;
    else if (t.tipe === "transfer") {
      if (t.walletId === walletId) saldo -= t.jumlah;
      if (t.walletTujuanId === walletId) saldo += t.jumlah;
    }
  }
  return saldo;
}

export interface RealisasiAnggaran {
  anggaran: number;
  terpakai: number;
  sisa: number;
  persen: number;          // 0..100+ (bisa >100 jika lewat)
  status: "aman" | "waspada" | "lewat";
  proyeksiAkhirBulan: number; // ekstrapolasi berdasarkan laju harian
}

/**
 * Realisasi anggaran vs pengeluaran.
 * @param ambangPersen ambang alert (default 80)
 * @param hariBerjalan hari ke-berapa dalam bulan (1..totalHari)
 * @param totalHari jumlah hari dalam bulan
 */
export function realisasiAnggaran(
  anggaran: number,
  terpakai: number,
  ambangPersen = 80,
  hariBerjalan = 1,
  totalHari = 30,
): RealisasiAnggaran {
  const persen = anggaran > 0 ? (terpakai / anggaran) * 100 : 0;
  let status: RealisasiAnggaran["status"] = "aman";
  if (persen >= 100) status = "lewat";
  else if (persen >= ambangPersen) status = "waspada";
  const lajuHarian = hariBerjalan > 0 ? terpakai / hariBerjalan : 0;
  const proyeksiAkhirBulan = Math.round(lajuHarian * totalHari);
  return { anggaran, terpakai, sisa: anggaran - terpakai, persen, status, proyeksiAkhirBulan };
}

export type AgingBucket = "belum" | "1-30" | "31-60" | "61-90" | ">90";

/** Tentukan bucket aging berdasarkan sisa/lewat hari jatuh tempo. */
export function agingBucket(hariKeJatuhTempo: number): AgingBucket {
  // hariKeJatuhTempo > 0 => belum jatuh tempo; <=0 => sudah lewat |x| hari
  if (hariKeJatuhTempo > 0) return "belum";
  const lewat = Math.abs(hariKeJatuhTempo);
  if (lewat <= 30) return "1-30";
  if (lewat <= 60) return "31-60";
  if (lewat <= 90) return "61-90";
  return ">90";
}

export interface HutangRingkas {
  pokok: number;
  terbayar: number;
  outstanding: number;
  lunas: boolean;
}

export function ringkasHutang(pokok: number, pembayaran: number[]): HutangRingkas {
  const terbayar = pembayaran.reduce((a, b) => a + b, 0);
  const outstanding = Math.max(0, pokok - terbayar);
  return { pokok, terbayar, outstanding, lunas: outstanding === 0 };
}

/** Savings rate = (pemasukan - pengeluaran) / pemasukan * 100. */
export function savingsRate(pemasukan: number, pengeluaran: number): number {
  if (pemasukan <= 0) return 0;
  return ((pemasukan - pengeluaran) / pemasukan) * 100;
}

/** Persentase perubahan vs periode sebelumnya. null jika pembanding 0. */
export function perubahanPersen(sekarang: number, sebelumnya: number): number | null {
  if (sebelumnya === 0) return sekarang === 0 ? 0 : null;
  return ((sekarang - sebelumnya) / Math.abs(sebelumnya)) * 100;
}

/** Perlu menabung per bulan untuk capai target tepat waktu. */
export function targetPerBulan(sisaTarget: number, hariTersisa: number): number {
  if (sisaTarget <= 0) return 0;
  const bulanTersisa = Math.max(1, Math.ceil(hariTersisa / 30));
  return Math.ceil(sisaTarget / bulanTersisa);
}
