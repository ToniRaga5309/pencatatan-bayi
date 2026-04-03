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
4. Klik **"Create new project"** dan tunggu hingga selesai (~2 menit)

### Langkah 2: Dapatkan Connection String

1. Di dashboard project Supabase, buka **Settings** (gear icon) → **Database**
2. Scroll ke bawah, temukan **Connection string**
3. Copy kedua URL berikut:

**Transaction pooling (untuk aplikasi):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct connection (untuk migration):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

> ⚠️ Ganti `[PROJECT-REF]`, `[PASSWORD]`, dan `[REGION]` sesuai data dari Supabase Anda.

---

## 2️⃣ Push ke GitHub

### Langkah 1: Inisialisasi Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Sistem Pencatatan Bayi Baru Lahir"
```

### Langkah 2: Buat Repository di GitHub
1. Buka [github.com](https://github.com) dan klik **"+" → "New repository"**
2. Nama: `sistem-bayi-baru-lahir`
3. Pilih **Private** atau **Public**
4. Jangan centang "Add a README file" (kita sudah punya)
5. Klik **"Create repository"**

### Langkah 3: Push ke GitHub
```bash
git remote add origin https://github.com/USERNAME/sistem-bayi-baru-lahir.git
git push -u origin main
```
Ganti `USERNAME` dengan username GitHub Anda.

---

## 3️⃣ Deploy ke Vercel

### Langkah 1: Connect ke Vercel
1. Buka [vercel.com](https://vercel.com) dan login dengan GitHub
2. Klik **"Add New..."** → **Project**
3. Import repository GitHub: `sistem-bayi-baru-lahir`
4. Klik **"Import"**

### Langkah 2: Set Environment Variables
Di halaman **Settings** → **Environment Variables**, tambahkan:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | *(dari Supabase dengan ?pgbouncer=true)* | Connection pooling untuk aplikasi |
| `DIRECT_DATABASE_URL` | *(dari Supabase tanpa ?pgbouncer)* | Direct connection untuk migration |
| `NEXTAUTH_SECRET` | *(generate dengan `openssl rand -base64 32`)* | Secret key untuk JWT signing |
| `NEXTAUTH_URL` | `https://nama-app.vercel.app` | URL production (tanpa trailing slash) |
| `NODE_ENV` | `production` | Environment production |

### Langkah 3: Deploy
1. Klik **"Deploy"**
2. Tunggu hingga proses build selesai (~3-5 menit)
3. Jika berhasil, buka URL aplikasi

---

## 4️⃣ Jalankan Database Migration & Seed

### Via Vercel Dashboard (Recommended)
1. Buka **Storage** → **Database** di Vercel dashboard
2. Klik **"Query"** tab
3. Jalankan migration:
   ```bash
   npx prisma migrate deploy
   ```
4. Jalankan seed:
   ```bash
   npx prisma db seed
   ```

### Via Local CLI
```bash
# Set environment variables lokal
export DATABASE_URL="your-supabase-url"
export DIRECT_DATABASE_URL="your-direct-url"

# Run migration
npx prisma migrate deploy

# Run seed
npx prisma db seed
```

---

## ✅ Setelah Deployment

### Test Akses
Gunakan akun default untuk testing:

| Role | Username | Password |
|------|----------|----------|
| Admin Dukcapil | `admin` | `password123` |
| Operator Puskesmas | `operator1` | `password123` |

### ⚠️ PENTING: Ganti Password Default!
Segera ganti password default setelah deploy!

1. Login sebagai admin
2. Buka menu **Kelola User** (Admin Dashboard)
3. Edit user dan set password baru yang kuat

---

## 🔧 Troubleshooting

### Error: Database Connection Failed
```
PrismaClientInitializationError: Can't reach database server
```
**Solusi:**
- Pastikan `DATABASE_URL` benar
- Ceksa IP Vercel tidak diblokir di Supabase (Settings → Database -> Connection Pooling)
- Pastikan password database benar
- Pastikan menggunakan mode **Transaction pooling** untuk aplikasi

### Error: Prisma Migration Failed
```
Error: P3001: Migration `xxx` failed
```
**Solusi:**
- Jalankan `npx prisma migrate deploy` (bukan `migrate dev`)
- Pastikan schema Prisma kompatibel dengan PostgreSQL
- Cek log di Vercel untuk detail error

### Error: NextAuth Session Invalid
```
[next-auth][error][JWT_SESSION_ERROR]
```
**Solusi:**
- Pastikan `NEXTAUTH_SECRET` sama di semua environment
- Pastikan `NEXTAUTH_URL` sesuai dengan domain production
- Clear browser cookies dan coba login ulang

### Error: Build Failed di Vercel
```
Error: Command "prisma generate" failed
```
**Solusi:**
- Pastikan `prisma` ada di dependencies (bukan devDependencies)
- Cek versi Node.js di Vercel (Settings → Environment Variables → NODE_VERSION=18)
- Jalankan build ulang

---

## 📁 Environment Variables Reference

### Development (.env.local)
```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="dev-secret-key-for-testing-only"
NEXTAUTH_URL="http://localhost:3000"
```

### Production (Vercel Dashboard)
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app-name.vercel.app"
NODE_ENV="production"
```

---

## 📞 Support
Jika mengalami masalah:
1. Buat issue di GitHub repository
2. Sertakan screenshot error dan langkah-langkah reproduksi
3. Jelaskan environment yang digunakan (development/production)
