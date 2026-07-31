import { describe, it, expect } from "vitest";
import {
  saldoDompet, realisasiAnggaran, agingBucket, ringkasHutang,
  savingsRate, perubahanPersen, targetPerBulan, type TxLike,
} from "../src/lib/finance";
import { formatRupiah, parseRupiahInput, formatCompact } from "../src/lib/format";

describe("saldoDompet", () => {
  const txs: TxLike[] = [
    { tipe: "income", jumlah: 5_000_000, walletId: 1 },
    { tipe: "expense", jumlah: 1_250_000, walletId: 1 },
    { tipe: "transfer", jumlah: 1_000_000, walletId: 1, walletTujuanId: 2 },
    { tipe: "transfer", jumlah: 500_000, walletId: 2, walletTujuanId: 1 },
    { tipe: "income", jumlah: 9_999, walletId: 2 }, // dompet lain, diabaikan
  ];
  it("menghitung income - expense - transfer keluar + transfer masuk", () => {
    expect(saldoDompet(1_000_000, 1, txs)).toBe(1_000_000 + 5_000_000 - 1_250_000 - 1_000_000 + 500_000);
  });
  it("dompet tujuan menerima transfer", () => {
    expect(saldoDompet(0, 2, txs)).toBe(1_000_000 - 500_000 + 9_999);
  });
  it("saldo awal saja jika tanpa transaksi", () => {
    expect(saldoDompet(750_000, 9, txs)).toBe(750_000);
  });
});

describe("realisasiAnggaran", () => {
  it("status aman di bawah ambang", () => {
    const r = realisasiAnggaran(1_000_000, 500_000, 80);
    expect(r.persen).toBe(50); expect(r.status).toBe("aman"); expect(r.sisa).toBe(500_000);
  });
  it("status waspada saat >= ambang", () => {
    expect(realisasiAnggaran(1_000_000, 850_000, 80).status).toBe("waspada");
  });
  it("status lewat saat >= 100%", () => {
    const r = realisasiAnggaran(1_000_000, 1_200_000);
    expect(r.status).toBe("lewat"); expect(r.sisa).toBe(-200_000);
  });
  it("proyeksi akhir bulan mengekstrapolasi laju harian", () => {
    const r = realisasiAnggaran(3_000_000, 1_000_000, 80, 10, 30);
    expect(r.proyeksiAkhirBulan).toBe(3_000_000);
  });
});

describe("agingBucket", () => {
  it("belum jatuh tempo", () => { expect(agingBucket(5)).toBe("belum"); });
  it("lewat 1-30 hari", () => { expect(agingBucket(-15)).toBe("1-30"); });
  it("lewat 31-60", () => { expect(agingBucket(-45)).toBe("31-60"); });
  it("lewat 61-90", () => { expect(agingBucket(-80)).toBe("61-90"); });
  it("lewat >90", () => { expect(agingBucket(-120)).toBe(">90"); });
  it("tepat jatuh tempo hari ini = 1-30", () => { expect(agingBucket(0)).toBe("1-30"); });
});

describe("ringkasHutang", () => {
  it("menjumlah pembayaran & hitung outstanding", () => {
    const r = ringkasHutang(5_000_000, [1_000_000, 2_000_000]);
    expect(r.terbayar).toBe(3_000_000); expect(r.outstanding).toBe(2_000_000); expect(r.lunas).toBe(false);
  });
  it("lunas saat outstanding 0", () => {
    expect(ringkasHutang(1_000_000, [1_000_000]).lunas).toBe(true);
  });
  it("outstanding tidak negatif jika lebih bayar", () => {
    expect(ringkasHutang(1_000_000, [1_500_000]).outstanding).toBe(0);
  });
});

describe("savingsRate", () => {
  it("hitung rasio menabung", () => { expect(savingsRate(10_000_000, 7_000_000)).toBe(30); });
  it("0 jika tanpa pemasukan", () => { expect(savingsRate(0, 500_000)).toBe(0); });
  it("bisa negatif jika boros", () => { expect(savingsRate(1_000_000, 1_500_000)).toBe(-50); });
});

describe("perubahanPersen", () => {
  it("naik 25%", () => { expect(perubahanPersen(1_250_000, 1_000_000)).toBe(25); });
  it("turun 50%", () => { expect(perubahanPersen(500_000, 1_000_000)).toBe(-50); });
  it("null jika pembanding 0 dan sekarang > 0", () => { expect(perubahanPersen(100, 0)).toBeNull(); });
});

describe("targetPerBulan", () => {
  it("bagi sisa target ke bulan tersisa", () => { expect(targetPerBulan(6_000_000, 90)).toBe(2_000_000); });
  it("0 jika target sudah tercapai", () => { expect(targetPerBulan(0, 30)).toBe(0); });
});

describe("format rupiah", () => {
  it("format dengan pemisah titik", () => { expect(formatRupiah(1_250_000)).toBe("Rp 1.250.000"); });
  it("nol", () => { expect(formatRupiah(0)).toBe("Rp 0"); });
  it("negatif", () => { expect(formatRupiah(-50_000)).toBe("-Rp 50.000"); });
  it("tanpa simbol", () => { expect(formatRupiah(1000, { withSymbol: false })).toBe("1.000"); });
  it("parse input jadi integer", () => { expect(parseRupiahInput("Rp 1.250.000")).toBe(1_250_000); });
  it("compact jutaan", () => { expect(formatCompact(1_250_000)).toBe("1,3 jt"); });
});
