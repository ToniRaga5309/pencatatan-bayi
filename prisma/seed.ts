// Seed data untuk Sistem Pencatatan Nama Bayi Baru Lahir
// Puskesmas di Kabupaten Ngada, Nusa Tenggara Timur
// Jalankan dengan: bun run prisma/seed.ts

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Daftar Puskesmas di Kabupaten Ngada
const puskesmasData = [
  { nama: "Puskesmas Bajawa", kodeWilayah: "530601", alamat: "Kecamatan Bajawa" },
  { nama: "Puskesmas Mataloko", kodeWilayah: "530602", alamat: "Kecamatan Golewa" },
  { nama: "Puskesmas Aimere", kodeWilayah: "530603", alamat: "Kecamatan Aimere" },
  { nama: "Puskesmas Boawae", kodeWilayah: "530604", alamat: "Kecamatan Boawae" },
  { nama: "Puskesmas Mauponggo", kodeWilayah: "530605", alamat: "Kecamatan Mauponggo" },
  { nama: "Puskesmas Soa", kodeWilayah: "530606", alamat: "Kecamatan Soa" },
  { nama: "Puskesmas Riung", kodeWilayah: "530607", alamat: "Kecamatan Riung" },
  { nama: "Puskesmas Nangaroro", kodeWilayah: "530608", alamat: "Kecamatan Nangaroro" },
  { nama: "Puskesmas Golewa", kodeWilayah: "530609", alamat: "Kecamatan Golewa" },
  { nama: "Puskesmas Wolowae", kodeWilayah: "530610", alamat: "Kecamatan Nanga-Wolowaru" },
  { nama: "Puskesmas Jerebuu", kodeWilayah: "530611", alamat: "Kecamatan Jerebuu" },
  { nama: "Puskesmas Wewo", kodeWilayah: "530612", alamat: "Kecamatan Wewo" }
]

// Fungsi untuk generate password dari nama puskesmas
// Format: NamaPuskesmas123! (Huruf Kapital, huruf kecil, angka, tanda seru)
function generatePassword(namaPuskesmas: string): string {
  // Ambil nama puskesmas tanpa "Puskesmas "
  const namaSingkat = namaPuskesmas.replace("Puskesmas ", "")
  
  // Kapitalisasi huruf pertama, sisanya huruf kecil
  const namaFormatted = namaSingkat.charAt(0).toUpperCase() + 
                        namaSingkat.slice(1).toLowerCase()
  
  // Generate nomor berdasarkan panjang nama
  const nomor = namaSingkat.length.toString().padStart(3, "0")
  
  // Password format: NamaPuskesmas + Nomor + !
  // Contoh: Bajawa006!
  return `${namaFormatted}${nomor}!`
}

// Fungsi untuk generate username dari nama puskesmas
function generateUsername(namaPuskesmas: string): string {
  const namaSingkat = namaPuskesmas.replace("Puskesmas ", "")
  return namaSingkat.toLowerCase().replace(/\s+/g, "_")
}

async function main() {
  console.log("🌱 Memulai seeding database...")
  console.log("📍 Kabupaten Ngada, Nusa Tenggara Timur\n")

  // Hapus data yang ada
  console.log("🗑️  Membersihkan data lama...")
  await prisma.auditLog.deleteMany()
  await prisma.birthRecord.deleteMany()
  await prisma.user.deleteMany()
  await prisma.puskesmas.deleteMany()

  // Buat data Puskesmas
  console.log("🏥 Membuat data Puskesmas Ngada...")
  const puskesmas = await Promise.all(
    puskesmasData.map((p) =>
      prisma.puskesmas.create({ data: p })
    )
  )
  console.log(`✅ ${puskesmas.length} Puskesmas berhasil dibuat\n`)

  // Buat Admin Dukcapil
  console.log("👤 Membuat Admin Dukcapil...")
  const adminPassword = "AdminNgada2024!"
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)
  
  const admin = await prisma.user.create({
    data: {
      username: "admin_dukcapil",
      password: hashedAdminPassword,
      namaLengkap: "Admin Dukcapil Ngada",
      role: "ADMIN",
      puskesmasId: null
    }
  })
  console.log(`✅ Admin Dukcapil berhasil dibuat`)
  console.log(`   Username: admin_dukcapil`)
  console.log(`   Password: ${adminPassword}\n`)

  // Buat Operator untuk setiap Puskesmas
  console.log("👥 Membuat Operator Puskesmas...")
  console.log("─".repeat(60))
  
  const operatorAccounts: Array<{ username: string; password: string; namaLengkap: string; puskesmas: string }> = []
  
  const operators = await Promise.all(
    puskesmas.map(async (p) => {
      const username = generateUsername(p.nama)
      const password = generatePassword(p.nama)
      const namaLengkap = `Operator ${p.nama.replace("Puskesmas ", "")}`
      
      operatorAccounts.push({
        username,
        password,
        namaLengkap,
        puskesmas: p.nama
      })
      
      const hashedPassword = await bcrypt.hash(password, 10)
      return prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          namaLengkap,
          role: "OPERATOR",
          puskesmasId: p.id
        }
      })
    })
  )

  // Tampilkan daftar akun operator
  console.log("📋 DAFTAR AKUN OPERATOR PUSKESMAS NGADA:")
  console.log("─".repeat(60))
  console.log(`${"No".padEnd(4)} | ${"Username".padEnd(20)} | ${"Password".padEnd(18)} | Puskesmas`)
  console.log("─".repeat(60))
  
  operatorAccounts.forEach((acc, index) => {
    const no = (index + 1).toString().padEnd(4)
    const uname = acc.username.padEnd(20)
    const pwd = acc.password.padEnd(18)
    const puskes = acc.puskesmas.replace("Puskesmas ", "")
    console.log(`${no} | ${uname} | ${pwd} | ${puskes}`)
  })
  
  console.log("─".repeat(60))
  console.log(`✅ ${operators.length} Operator berhasil dibuat\n`)

  // Buat contoh data kelahiran
  console.log("👶 Membuat data kelahiran contoh...")
  const sampleBirthRecords = [
    {
      nikIbu: "5306014567890001",
      namaIbu: "MARIA MAGDALENA",
      namaAyah: "YOHANES SERAN",
      namaBayi: "FRANSISKUS SERAN",
      tanggalLahir: new Date("2024-01-15"),
      tempatLahir: "RSUD BAJAWA",
      jenisKelamin: "LAKI_LAKI",
      status: "VERIFIED",
      puskesmasId: puskesmas[0].id,
      createdBy: operators[0].id
    },
    {
      nikIbu: "5306025678900002",
      namaIbu: "AGUSTINA WAE",
      namaAyah: "PAULUS BEO",
      namaBayi: "THERESIA BEO",
      tanggalLahir: new Date("2024-01-18"),
      tempatLahir: "PUSKESMAS MATALOKO",
      jenisKelamin: "PEREMPUAN",
      status: "VERIFIED",
      puskesmasId: puskesmas[1].id,
      createdBy: operators[1].id
    },
    {
      nikIbu: "5306036789010003",
      namaIbu: "ROSMINI DHAKI",
      namaAyah: "MATEOS GEBA",
      namaBayi: "YOHANES GEBA",
      tanggalLahir: new Date("2024-01-20"),
      tempatLahir: "PUSKESMAS AIMERE",
      jenisKelamin: "LAKI_LAKI",
      status: "VERIFIED",
      puskesmasId: puskesmas[2].id,
      createdBy: operators[2].id
    }
  ]

  const birthRecords = await Promise.all(
    sampleBirthRecords.map((record) =>
      prisma.birthRecord.create({ data: record })
    )
  )
  console.log(`✅ ${birthRecords.length} data kelahiran contoh berhasil dibuat\n`)

  console.log("=".repeat(60))
  console.log("🎉 SEEDING SELESAI!")
  console.log("=".repeat(60))
  console.log("\n📋 RINGKASAN AKUN LOGIN:")
  console.log("─".repeat(60))
  console.log("ADMIN DUKCAPIL:")
  console.log("   Username: admin_dukcapil")
  console.log("   Password: AdminNgada2024!")
  console.log("─".repeat(60))
  console.log("OPERATOR PUSKESMAS (12 akun):")
  console.log("   Lihat daftar lengkap di atas")
  console.log("─".repeat(60))
  console.log("💡 Format Password Operator: [NamaPuskesmas][Nomor]!")
  console.log("   Contoh: Bajawa006! | Aimere006! | Soa003!")
  console.log("=".repeat(60))
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
