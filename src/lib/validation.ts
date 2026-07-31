import { z } from "zod";

const rupiah = z.number().int("Harus bilangan bulat").nonnegative("Tidak boleh negatif");

export const transaksiSchema = z
  .object({
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal salah"),
    tipe: z.enum(["income", "expense", "transfer"]),
    jumlah: rupiah.positive("Nominal harus lebih dari 0"),
    walletId: z.number().int().positive("Pilih dompet"),
    walletTujuanId: z.number().int().positive().nullable().optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    catatan: z.string().max(500).optional().default(""),
    tags: z.array(z.string()).optional().default([]),
  })
  .refine((d) => d.tipe !== "transfer" || !!d.walletTujuanId, {
    message: "Transfer wajib memilih dompet tujuan", path: ["walletTujuanId"],
  })
  .refine((d) => d.tipe !== "transfer" || d.walletTujuanId !== d.walletId, {
    message: "Dompet tujuan harus berbeda", path: ["walletTujuanId"],
  })
  .refine((d) => d.tipe === "transfer" || !!d.categoryId, {
    message: "Pilih kategori", path: ["categoryId"],
  });

export const walletSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(60),
  tipe: z.enum(["cash", "bank", "ewallet", "investasi", "lainnya"]),
  saldoAwal: z.number().int().default(0),
  warna: z.string().default("violet"),
  ikon: z.string().default("wallet"),
});

export const kategoriSchema = z.object({
  nama: z.string().min(1).max(60),
  tipe: z.enum(["income", "expense"]),
  parentId: z.number().int().positive().nullable().optional(),
  ikon: z.string().default("tag"),
  warna: z.string().default("violet"),
});

export const anggaranSchema = z.object({
  categoryId: z.number().int().positive(),
  periode: z.string().regex(/^\d{4}-\d{2}$/),
  jumlahAnggaran: rupiah.positive(),
  ambangAlert: z.number().int().min(1).max(100).default(80),
  isRecurring: z.boolean().default(false),
});

export const hutangSchema = z.object({
  tipe: z.enum(["hutang", "piutang"]),
  namaPihak: z.string().min(1).max(80),
  jumlahPokok: rupiah.positive(),
  tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tanggalJatuhTempo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  bungaPersen: z.number().nonnegative().nullable().optional(),
  catatan: z.string().max(500).optional().default(""),
});

export const cicilanSchema = z.object({
  debtId: z.number().int().positive(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jumlah: rupiah.positive(),
  walletId: z.number().int().positive(),
  catatan: z.string().max(300).optional().default(""),
});

export const targetSchema = z.object({
  nama: z.string().min(1).max(80),
  jumlahTarget: rupiah.positive(),
  tanggalTarget: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  walletId: z.number().int().positive().nullable().optional(),
  warna: z.string().default("violet"),
  ikon: z.string().default("target"),
});

export const setoranSchema = z.object({
  goalId: z.number().int().positive(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jumlah: rupiah.positive(),
  walletId: z.number().int().positive(),
});

export type TransaksiInput = z.infer<typeof transaksiSchema>;
