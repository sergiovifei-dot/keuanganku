# 🚀 Cara Membuat Aplikasi Online (Untuk yang TIDAK Bisa Ngoding)

Ikuti berurutan. Semua lewat **klik di website** — tidak perlu mengetik kode.
Anda cukup punya **1 akun: Vercel** (gratis). Neon (database) tersambung otomatis dari dalam Vercel.

> Secret URL Anda sudah dibuatkan: **`DLkBGEm2nXwCzonxc-EAHg`**
> (boleh diganti nanti — lihat langkah 8)

---

## ✅ Checklist Langkah

**1. Siapkan kode di GitHub (tempat menyimpan proyek)**
   1. Buat akun gratis di https://github.com → klik **New repository** → beri nama `keuanganku` → **Create**.
   2. Di halaman repo kosong, klik **“uploading an existing file”**.
   3. Buka folder `keuanganku` di komputer Anda, **pilih semua isinya**, lalu **seret (drag) ke halaman GitHub**. Tunggu terunggah → klik **Commit changes**.

**2. Buat akun Vercel**
   - Buka https://vercel.com/signup → pilih **Continue with GitHub** (paling mudah, langsung tersambung).

**3. Import proyek ke Vercel**
   1. Di dashboard Vercel → **Add New… → Project**.
   2. Pilih repo `keuanganku` → **Import**.
   3. **JANGAN klik Deploy dulu.** Lanjut ke langkah 4 untuk isi database & secret. (Kalau terlanjur ke-deploy dan error, tenang — kita perbaiki di langkah 4–6 lalu Redeploy.)

**4. Pasang database Neon (gratis, dari dalam Vercel)**
   1. Buka tab **Storage** di proyek Anda → **Create Database** → pilih **Neon** (Postgres) → ikuti klik sampai selesai.
   2. Vercel otomatis menambahkan variabel **`DATABASE_URL`** ke proyek. (Tidak perlu menyalin apa pun.)

**5. Tambahkan secret URL**
   1. Buka **Settings → Environment Variables**.
   2. **Key:** `APP_SECRET_SLUG`  **Value:** `DLkBGEm2nXwCzonxc-EAHg`
   3. Pilih semua environment (Production, Preview, Development) → **Save**.

**6. Deploy**
   - Buka tab **Deployments → Redeploy** (atau tombol **Deploy**). Tunggu sampai muncul **“Ready”** (± 1–2 menit).
   - Catat alamat aplikasi Anda, misal: `https://keuanganku-xxxx.vercel.app`

**7. Nyalakan database (SEKALI saja) — cukup buka 1 link di browser**
   - Buka alamat ini di browser (ganti `keuanganku-xxxx` dengan alamat Anda):
     ```
     https://keuanganku-xxxx.vercel.app/api/setup?secret=DLkBGEm2nXwCzonxc-EAHg
     ```
   - Akan muncul **“✅ Database siap!”** dan tombol **Buka Keuanganku**. Klik tombol itu. Selesai! 🎉
   - (Link ini membuat semua tabel + mengisi dompet & kategori awal. Aman dibuka ulang.)

**8. (Opsional) Ganti secret agar lebih pribadi**
   - Buat kata acak sendiri (≥20 huruf/angka), lalu di **Settings → Environment Variables** ubah nilai `APP_SECRET_SLUG` → **Redeploy**. Ulangi langkah 7 dengan secret baru.

**9. Pasang di HP seperti aplikasi (PWA)**
   - Buka alamat rahasia Anda di **Chrome (Android)** atau **Safari (iPhone)** → menu → **Add to Home Screen**. Ikon **Keuanganku** akan muncul di layar HP.

---

## 🔖 Simpan baik-baik
- **Alamat rahasia Anda:** `https://<alamat-vercel-anda>/DLkBGEm2nXwCzonxc-EAHg`
- Siapa pun yang punya alamat ini bisa melihat data Anda — jangan dibagikan.
- Bisa lihat & salin alamat ini kapan saja di halaman **Pengaturan** dalam aplikasi.

## ❓ Kalau ada yang error
- Halaman error saat pertama buka? Biasanya **langkah 7 belum dijalankan** — buka link `/api/setup?...` dulu.
- Masih 404 di alamat rahasia? Pastikan `APP_SECRET_SLUG` di Vercel **sama persis** dengan yang ada di URL, lalu **Redeploy**.
