# 🚀 Panduan Deployment

## Deploy ke Vercel dengan Supabase

Panduan lengkap untuk mendeploy **Sistem Pencatatan Nama Bayi Baru Lahir** ke production.

---

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

1. **Akun GitHub** - untuk menyimpan kode
2. **Akun Supabase** - untuk database PostgreSQL (gratis di [supabase.com](https://supabase.com))
3. **Akun Vercel** - untuk hosting (gratis di [vercel.com](https://vercel.com))

---

## 1️⃣ Setup Supabase Database

### Langkah 1: Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan login/sign up
2. Klik **"New Project"**
3. Isi form:
   - **Name**: `sistem-bayi-baru-lahir`
   - **Database Password**: Buat password yang kuat (simpan baik-baik!)
   - **Region**: Pilih yang terdekat (Singapore untuk Indonesia)
4. Klik **"Create new project"** dan tunggu hingga selesai

### Langkah 2: Dapatkan Connection String

1. Di dashboard Supabase, buka **Settings** → **Database**
2. Scroll ke bagian **Connection string**
3. Copy **Connection string** untuk **URI** format:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. Copy juga **Direct connection**:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```

---

## 2️⃣ Setup GitHub Repository

### Langkah 1: Push ke GitHub

```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit - Sistem Pencatatan Bayi Baru Lahir"

# Tambahkan remote repository
git remote add origin https://github.com/USERNAME/sistem-bayi-baru-lahir.git

# Push ke GitHub
git push -u origin main
```

---

## 3️⃣ Deploy ke Vercel

### Langkah 1: Import Project

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **"Add New"** → **"Project"**
3. Pilih repository GitHub yang sudah dibuat
4. Klik **"Import"**

### Langkah 2: Configure Environment Variables

Di halaman konfigurasi, tambahkan Environment Variables berikut:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres` |
| `NEXTAUTH_SECRET` | Generate dengan: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (URL Vercel Anda) |

### Langkah 3: Deploy

1. Klik **"Deploy"**
2. Tunggu hingga proses selesai
3. Klik **"Continue to Dashboard"**

### Langkah 4: Run Database Migration

Setelah deploy berhasil, Anda perlu menjalankan migrasi database:

**Option A: Menggunakan Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

**Option B: Menggunakan Prisma Studio via Local**
```bash
# Set DATABASE_URL di .env.local dengan nilai dari Supabase
# Lalu jalankan:
npx prisma migrate deploy
npx prisma db seed
```

---

## 4️⃣ Verifikasi Deployment

1. Buka URL Vercel Anda: `https://your-project.vercel.app`
2. Anda akan melihat halaman login
3. Login dengan kredensial default:
   - **Admin**: username: `admin`, password: `password123`
   - **Operator**: username: `operator1`, password: `password123`

⚠️ **PENTING**: Setelah login pertama kali, segera ganti password default!

---

## 🔧 Post-Deployment Tasks

### 1. Ganti Password Default

```sql
-- Jalankan di Supabase SQL Editor
-- Ganti password admin
-- Password baru harus di-hash dengan bcrypt terlebih dahulu
```

Atau gunakan fitur "Edit User" di dashboard Admin.

### 2. Tambah Data Puskesmas

Login sebagai Admin dan tambahkan data Puskesmas melalui menu **Kelola User**.

### 3. Setup Custom Domain (Opsional)

1. Di Vercel Dashboard, buka **Settings** → **Domains**
2. Tambahkan domain Anda
3. Update `NEXTAUTH_URL` di Environment Variables

---

## 🔄 Update & Redeploy

Setiap kali Anda push ke branch `main`, Vercel akan otomatis redeploy:

```bash
git add .
git commit -m "Update fitur"
git push origin main
```

---

## 🆘 Troubleshooting

### Error: Database Connection Failed
- Periksa `DATABASE_URL` dan `DIRECT_DATABASE_URL`
- Pastikan IP Vercel tidak diblokir di Supabase

### Error: Prisma Migration Failed
- Jalankan `npx prisma migrate deploy` secara manual
- Pastikan schema Prisma sudah benar

### Error: NextAuth Session Invalid
- Periksa `NEXTAUTH_SECRET` dan `NEXTAUTH_URL`
- Pastikan `NEXTAUTH_URL` sesuai dengan domain production

---

## 📞 Support

Jika mengalami masalah, silakan buat issue di GitHub repository.
