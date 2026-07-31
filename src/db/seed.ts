import "dotenv/config";
import { getDb } from "./index";
import { wallets, categories, settings } from "./schema";

const DOMPET = [
  { nama: "Tunai", tipe: "cash", warna: "emerald", ikon: "banknote", urutan: 1 },
  { nama: "Bank BCA", tipe: "bank", warna: "sky", ikon: "landmark", urutan: 2 },
  { nama: "GoPay", tipe: "ewallet", warna: "teal", ikon: "smartphone", urutan: 3 },
  { nama: "Rekening Tabungan", tipe: "bank", warna: "violet", ikon: "piggy-bank", urutan: 4 },
];

const EXPENSE = [
  ["Makan & Minum", "utensils", "orange"], ["Transportasi", "car", "sky"],
  ["Belanja Harian", "shopping-cart", "amber"], ["Tagihan & Utilitas", "receipt", "violet"],
  ["Kesehatan", "heart-pulse", "pink"], ["Pendidikan", "graduation-cap", "teal"],
  ["Hiburan", "gamepad-2", "lime"], ["Donasi & Zakat", "hand-heart", "emerald"],
  ["Cicilan", "credit-card", "red"], ["Asuransi", "shield", "slate"],
  ["Lain-lain", "ellipsis", "slate"],
];

const INCOME = [
  ["Gaji", "wallet", "emerald"], ["Bonus & THR", "gift", "amber"],
  ["Bisnis Sampingan", "store", "sky"], ["Hasil Investasi", "trending-up", "violet"],
  ["Hadiah", "party-popper", "pink"], ["Lain-lain", "ellipsis", "slate"],
];

async function main() {
  const db = getDb();
  const existing = await db.select().from(wallets).limit(1);
  if (existing.length > 0) {
    console.log("Seed dilewati: data sudah ada.");
    return;
  }
  await db.insert(wallets).values(DOMPET);
  await db.insert(categories).values([
    ...EXPENSE.map(([nama, ikon, warna]) => ({ nama, tipe: "expense", ikon, warna })),
    ...INCOME.map(([nama, ikon, warna]) => ({ nama, tipe: "income", ikon, warna })),
  ]);
  await db.insert(settings).values({ mataUang: "IDR", awalPeriodeBulan: 1, tema: "system" });
  console.log("Seed selesai: 4 dompet, 17 kategori, 1 pengaturan.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
