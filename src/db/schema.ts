import {
  pgTable, serial, integer, bigint, text, boolean, timestamp, date, index,
} from "drizzle-orm/pg-core";

// Catatan: semua nominal uang disimpan sebagai bigint (integer rupiah).

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  tipe: text("tipe").notNull().default("cash"), // cash|bank|ewallet|investasi|lainnya
  saldoAwal: bigint("saldo_awal", { mode: "number" }).notNull().default(0),
  warna: text("warna").notNull().default("violet"),
  ikon: text("ikon").notNull().default("wallet"),
  urutan: integer("urutan").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  tipe: text("tipe").notNull(), // income|expense
  parentId: integer("parent_id"),
  ikon: text("ikon").notNull().default("tag"),
  warna: text("warna").notNull().default("violet"),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    tanggal: date("tanggal").notNull(),
    tipe: text("tipe").notNull(), // income|expense|transfer
    jumlah: bigint("jumlah", { mode: "number" }).notNull(),
    walletId: integer("wallet_id"),
    walletTujuanId: integer("wallet_tujuan_id"),
    categoryId: integer("category_id"),
    debtId: integer("debt_id"),
    catatan: text("catatan").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    attachmentUrl: text("attachment_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tanggalIdx: index("tx_tanggal_idx").on(t.tanggal),
    walletIdx: index("tx_wallet_idx").on(t.walletId),
    categoryIdx: index("tx_category_idx").on(t.categoryId),
  }),
);

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").notNull(),
    periode: text("periode").notNull(), // YYYY-MM
    jumlahAnggaran: bigint("jumlah_anggaran", { mode: "number" }).notNull(),
    ambangAlert: integer("ambang_alert").notNull().default(80),
    isRecurring: boolean("is_recurring").notNull().default(false),
  },
  (t) => ({
    periodeIdx: index("budget_periode_idx").on(t.periode),
    catIdx: index("budget_cat_idx").on(t.categoryId),
  }),
);

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  tipe: text("tipe").notNull(), // hutang|piutang
  namaPihak: text("nama_pihak").notNull(),
  jumlahPokok: bigint("jumlah_pokok", { mode: "number" }).notNull(),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalJatuhTempo: date("tanggal_jatuh_tempo"),
  bungaPersen: integer("bunga_persen"),
  status: text("status").notNull().default("aktif"), // aktif|lunas|macet
  catatan: text("catatan").notNull().default(""),
});

export const debtPayments = pgTable("debt_payments", {
  id: serial("id").primaryKey(),
  debtId: integer("debt_id").notNull(),
  tanggal: date("tanggal").notNull(),
  jumlah: bigint("jumlah", { mode: "number" }).notNull(),
  walletId: integer("wallet_id"),
  catatan: text("catatan").notNull().default(""),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  jumlahTarget: bigint("jumlah_target", { mode: "number" }).notNull(),
  tanggalTarget: date("tanggal_target"),
  walletId: integer("wallet_id"),
  warna: text("warna").notNull().default("violet"),
  ikon: text("ikon").notNull().default("target"),
  status: text("status").notNull().default("aktif"), // aktif|tercapai|batal
});

export const goalContributions = pgTable("goal_contributions", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  tanggal: date("tanggal").notNull(),
  jumlah: bigint("jumlah", { mode: "number" }).notNull(),
  walletId: integer("wallet_id"),
});

export const recurringTransactions = pgTable("recurring_transactions", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  tipe: text("tipe").notNull(),
  jumlah: bigint("jumlah", { mode: "number" }).notNull(),
  categoryId: integer("category_id"),
  walletId: integer("wallet_id"),
  frekuensi: text("frekuensi").notNull().default("bulanan"),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalBerakhir: date("tanggal_berakhir"),
  tanggalEksekusiBerikutnya: date("tanggal_eksekusi_berikutnya").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  mataUang: text("mata_uang").notNull().default("IDR"),
  awalPeriodeBulan: integer("awal_periode_bulan").notNull().default(1),
  tema: text("tema").notNull().default("system"),
  pinHash: text("pin_hash"),
  pinAktif: boolean("pin_aktif").notNull().default(false),
});

export type Wallet = typeof wallets.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
