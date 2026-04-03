# 🚀 Panduan Deployment ke Vercel + Supabase

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
1. Di dashboard project Supabase, buka **Settings** → **Database**
2. Scroll ke bawah, temukan bagian **Connection string**
3. Pilih mode **URI** dan salin connection string
   
   **Untuk Transaction pooling (DATABASE_URL):**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   
   **Untuk Direct connection (DIRECT_DATABASE_URL):**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   
   > ⚠️ Ganti `[PROJECT-REF]`, `[PASSWORD]`, dan `[REGION]` sesuai data Anda

4. Simpan ked-dua URL ini - Anda akan butuhkan untuk environment variables

---

## 2️⃣ Push ke GitHub
### Langkah 1: Inisialisasi Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Sistem Pencatatan Bayi Baru Lahir"
```

### Langkah 2: Buat Repository di GitHub
1. Buka [github.com](https://github.com) dan klik **"+" → **New repository**
2. Nama: `sistem-bayi-baru-lahir`
3. Pilih **Private** atau **Public**
4. Jangan centang "Add a README file"
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
Di halaman konfigurasi Vercel, tambahkan environment variables berikut:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Dari Supabase (dengan pgbouncer) |
| `DIRECT_DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres` | Dari Supabase (tanpa pgbouncer) |
| `NEXTAUTH_SECRET` | Generate dengan: `openssl rand -base64 32` | Secret key untuk JWT |
| `NEXTAUTH_URL` | `https://nama-app.vercel.app` | URL production (tanpa trailing slash) |
| `NODE_ENV` | `production` | Environment production |

### Langkah 3: Deploy
1. Klik **"Deploy"**
2. Tunggu hingga proses build selesai
3. Jika berhasil, buka URL aplikasi

---

## 4️⃣ Jalankan Seed Data
Setelah deploy pertama kali, jalankan seed untuk mengisi data awal:

### Metode 1: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull

# Jalankan seed
bun run prisma/seed.ts
```

### Metode 2: Via Prisma Studio
1. Buka Prisma Studio:
   ```bash
   npx prisma studio
   ```
2. Tambah data secara manual melalui UI

---

## ✅ Setelah Deployment

### Test Akses
Gunakan akun default untuk testing:

| Role | Username | Password |
|------|----------|----------|
| Admin Dukcapil | `admin` | `password123` |
| Operator Puskesmas | `operator1` | `password123` |

### Ganti Password Default
⚠️ **PENTING**: Segera ganti password default setelah deploy!

1. Login sebagai admin
2. Buka menu **Kelola User**
3. Edit user dan set password baru yang kuat

---

## 📁 Environment Variables

### File .env.local (Development)
```env
DATABASE_URL="file:/home/z/my-project/db/custom.db"
NEXTAUTH_SECRET="dev-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

### File .env (Production - Vercel)
Set via Vercel Dashboard:
```env
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

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

### Error: Prisma Migration Failed
```
Error: P3001: Migration `xxx` failed
```
**Solusi:**
- Jalankan `npx prisma migrate deploy` secara manual
- Pastikan schema Prisma kompatibel dengan PostgreSQL

### Error: NextAuth Session Invalid
```
[next-auth][error][JWT_SESSION_ERROR]
```
**Solusi:**
- Pastikan `nextauth_secret` sama di semua instance
- Pastikan `nextauth_url` sesuai dengan domain production

### Error: Build Failed di Vercel
```
Error: Command "prisma generate" failed
```
**Solusi:**
- Pastikan `prisma` ada di dependencies
- Jalankan build ulang

---

## 📞 Support
Jika mengalami masalah, silakan:
1. Buat issue di GitHub repository
2. Sertakan screenshot error dan langkah-langkah reproduksi
3. Jelaskan environment yang digunakan (development/production)
