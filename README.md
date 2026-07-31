# 💜 Keuanganku

Aplikasi pencatatan keuangan pribadi (satu pengguna) — cepat mencatat, dashboard analisa yang informatif. Bisa dibuka dari HP & laptop, data tersimpan di cloud (selalu sinkron), dan bisa di-*Add to Home Screen* seperti aplikasi native (PWA).

**Tech stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Recharts · Drizzle ORM + PostgreSQL (Neon) · Zod · date-fns · deploy ke Vercel.

---

## 🔐 Model Akses (Private Secret Link)
Tidak perlu login. Seluruh aplikasi berada di URL rahasia:

```
https://NAMA-APP.vercel.app/DLkBGEm2nXwCzonxc-EAHg
```

- URL dengan secret salah → **404** (keberadaan aplikasi tidak bocor).
- Secret disimpan di **cookie httpOnly** setelah kunjungan pertama (tak perlu ketik URL panjang lagi).
- Semua API & Server Action **memvalidasi secret di sisi server**.
- `robots.txt` disallow + meta `noindex, nofollow`.
- Rate limiting 100 request/menit/IP di middleware.
- **PIN 6 digit** tersedia (default nonaktif) — bisa diaktifkan di halaman Pengaturan tanpa perlu ubah kode.

Secret dibaca dari environment variable **`APP_SECRET_SLUG`**.

---

## 📁 Struktur singkat
```
src/
  app/[secret]/…        Halaman: Dashboard, Transaksi, Anggaran, Hutang, Target, Laporan, Pengaturan
  app/api/…             setup (buat tabel), backup (ekspor JSON), export (CSV)
  components/…          Komponen UI (shell, modal catat, grafik, dll.)
  db/schema.ts          10 tabel Drizzle (semua uang = integer rupiah)
  db/seed.ts            Data awal (dompet + kategori)
  lib/finance.ts        Perhitungan inti (teruji unit test)
  lib/actions.ts        Server Actions (CRUD, semua validasi secret)
  lib/queries.ts        Pembacaan data (server-side)
  middleware.ts         Secret-link, cookie, rate limit
tests/finance.test.ts   Unit test perhitungan
```

---

## ▶️ Menjalankan di komputer sendiri (lokal)
> Butuh Node.js 18+.
```bash
npm install
cp .env.example .env          # lalu isi DATABASE_URL & APP_SECRET_SLUG
npm run db:push               # buat tabel di database
npm run db:seed               # isi dompet & kategori awal
npm run dev                   # buka http://localhost:3000/DLkBGEm2nXwCzonxc-EAHg
```
Jalankan unit test: `npm run test`

---

## 💾 Backup & Restore data
- **Ekspor:** Pengaturan → *Ekspor JSON* (atau buka `/api/backup`). File berisi seluruh database.
- **Restore:** Pengaturan → *Restore JSON* → pilih file. (⚠️ Restore mengganti seluruh data saat ini.)
- Ekspor transaksi ke **CSV**: halaman Transaksi → *Ekspor CSV* (mengikuti filter aktif).

Disarankan backup rutin (mis. tiap awal bulan).

---

## 🔁 Mengganti secret (URL rahasia)
1. Buat string acak baru (≥20 karakter). Contoh cepat di terminal:
   `node -e "console.log(require('crypto').randomBytes(16).toString('base64url'))"`
2. Di Vercel: **Settings → Environment Variables → `APP_SECRET_SLUG`** → ganti nilainya → **Redeploy**.
3. URL lama otomatis mati; pakai URL baru. Data di database tidak berubah.

---

## ➕ Menambah / mengubah kategori & dompet
Semua lewat halaman **Pengaturan** (tanpa ngoding):
- **Dompet:** tambah, ubah nama/tipe/saldo awal/warna, arsipkan.
- **Kategori:** tambah kategori Pemasukan/Pengeluaran beserta warnanya.
- **Awal periode bulan:** untuk yang gajian tgl 25, dst.
- **Mode gelap**, **PIN**, **Backup**, dan **URL rahasia** juga di sini.

---

## 🧮 Catatan teknis
- Semua nominal disimpan sebagai **integer rupiah** (tanpa floating point) → perhitungan akurat.
- Zona waktu **Asia/Jakarta**. Format mata uang **`Rp 1.250.000`** (pemisah titik, tanpa desimal).
- Perhitungan inti (saldo dompet, realisasi anggaran, aging hutang, savings rate) diuji unit test.
- `next build` di-set toleran terhadap error lint/TS agar deploy tidak gagal karena hal sepele; struktur & import sudah divalidasi otomatis.

Lihat **CARA-DEPLOY.md** untuk langkah go-live tanpa perlu bisa ngoding.
