# LAPORAN SISTEM PENCATATAN NAMA BAYI BARU LAHIR
## Puskesmas & Dukcapil Kabupaten Ngada

---

## 📋 PENDAHULUAN

Sistem Pencatatan Nama Bayi Baru Lahir adalah aplikasi web yang digunakan untuk mencatat data kelahiran bayi di wilayah Kerja Puskesmas Kabupaten Ngada. Data yang tercatat akan menjadi dasar penerbitan Akta Kelahiran oleh Dukcapil.

---

## 🏗️ STRUKTUR PENGGUNA

### 1. Admin Dukcapil
- **Tugas:** Mengelola seluruh data kelahiran dari seluruh Puskesmas
- **Akses:** Penuh terhadap seluruh sistem
- **Kewenangan:**
  - Melihat semua data kelahiran
  - Mengunduh data dalam format Excel untuk penerbitan Akta Kelahiran
  - Mengelola akun operator Puskesmas

### 2. Operator Puskesmas
- **Tugas:** Menginput data kelahiran di wilayah kerjanya
- **Akses:** Terbatas pada data Puskesmasnya sendiri
- **Kewenangan:**
  - Menginput data bayi baru lahir
  - Melihat riwayat penginputan
  - Mencetak bukti pencatatan

---

## 🔄 ALUR KERJA SISTEM

```
┌─────────────────────────────────────────────────────────────┐
│                    ALUR PENCATATAN BAYI                     │
└─────────────────────────────────────────────────────────────┘

1. INPUT DATA
   └── Operator Puskesmas menginput data bayi baru lahir:
       • NIK Ibu (16 digit)
       • Nama Ibu
       • Nama Ayah
       • Nama Bayi
       • Tanggal Lahir
       • Tempat Lahir
       • Jenis Kelamin (Laki-laki/Perempuan)

2. PENYIMPANAN DATA
   └── Data otomatis tersimpan di sistem dengan status "Terverifikasi"

3. PENGUNDUHAN DATA
   └── Admin Dukcapil mengunduh data dalam format Excel:
       • Data Baru = Data yang belum pernah diunduh
       • Register = Seluruh data yang sudah tercatat

4. PENERBITAN AKTA
   └── Data Excel digunakan sebagai dasar pembuatan Akta Kelahiran

```

---

## 📱 FITUR UTAMA

### Untuk Operator Puskesmas:
| Fitur | Keterangan |
|-------|------------|
| Input Data | Formulir penginputan data bayi |
| Riwayat | Daftar data yang sudah diinput |
| Dashboard | Ringkasan jumlah data |

### Untuk Admin Dukcapil:
| Fitur | Keterangan |
|-------|------------|
| Dashboard | Statistik keseluruhan data |
| Data Baru | Data yang belum diunduh |
| Register | Seluruh data tercatat |
| Unduh Excel | Export data ke format Excel |
| Kelola User | Pengelolaan akun operator |

---

## 🔐 KEAMANAN

1. **Login Terproteksi** - Setiap pengguna memiliki username dan password
2. **Pembagian Akses** - Operator hanya bisa melihat data Puskesmasnya
3. **Riwayat Aktivitas** - Setiap aktivitas tercatat dalam sistem
4. **Sesi Otomatis** - Login akan otomatis berakhir setelah 15 menit tidak aktif

---

## 💻 AKSES SISTEM

**Alamat Website:** https://pencatatan-bayi.vercel.app

**Akun Login:**

| Peran | Username | Password |
|-------|----------|----------|
| Admin Dukcapil | admin_dukcapil | AdminNgada2024! |
| Operator Bajawa | bajawa | Bajawa006! |
| Operator Mataloko | mataloko | Mataloko008! |
| Operator Aimere | aimere | Aimere006! |
| Operator Boawae | boawae | Boawae006! |
| Operator Mauponggo | mauponggo | Mauponggo009! |
| Operator Soa | soa | Soa003! |
| Operator Riung | riung | Riung005! |
| Operator Nangaroro | nangaroro | Nangaroro009! |
| Operator Golewa | golewa | Golewa006! |
| Operator Wolowae | wolowae | Wolowae007! |
| Operator Jerebuu | jerebuu | Jerebuu007! |
| Operator Wewo | wewo | Wewo004! |

---

## 📊 MANFAAT SISTEM

1. ✅ **Tidak Perlu Kertas** - Semua data tersimpan digital
2. ✅ **Cepat dan Akurat** - Data langsung tersimpan dan terverifikasi
3. ✅ **Mudah Diakses** - Bisa diakses kapan saja dan dari mana saja
4. ✅ **Data Aman** - Tersimpan di server yang terenkripsi
5. ✅ **Format Standar** - Data Excel siap pakai untuk Akta Kelahiran

---

## 📞 KONTAK

Untuk pertanyaan atau kendala teknis, silakan hubungi tim pengembang.

---

*Laporan dibuat: Maret 2024*
*Sistem Pencatatan Nama Bayi Baru Lahir*
*Dinas Kependudukan dan Pencatatan Sipil Kabupaten Ngada*
