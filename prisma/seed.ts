// Seed data untuk Sistem Pencatatan Nama Bayi Baru Lahir
// Puskesmas di Kabupaten Ngada, Nusa Tenggara Timur
// Jalankan dengan: bun run prisma/seed.ts

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Daftar Puskesmas di Kabupaten Ngada (sesuai data production)
const puskesmasData = [
  { nama: "Puskesmas Mangulewa", kodeWilayah: "530601", alamat: "Kecamatan Mangulewa" },
  { nama: "Puskesmas Laja", kodeWilayah: "530602", alamat: "Kecamatan Laja" },
  { nama: "Puskesmas Boba", kodeWilayah: "530603", alamat: "Kecamatan Boba" },
  { nama: "Puskesmas Natarandang", kodeWilayah: "530604", alamat: "Kecamatan Natarandang" },
  { nama: "Puskesmas Uluwae", kodeWilayah: "530605", alamat: "Kecamatan Uluwae" },
  { nama: "Puskesmas Inelika Raya", kodeWilayah: "530606", alamat: "Kecamatan Inelika Raya" },
  { nama: "Puskesmas Watukapu", kodeWilayah: "530607", alamat: "Kecamatan Watukapu" },
  { nama: "Puskesmas Ngara", kodeWilayah: "530608", alamat: "Kecamatan Ngara" },
  { nama: "Puskesmas Lindi", kodeWilayah: "530609", alamat: "Kecamatan Lindi" },
  { nama: "Puskesmas Maronggela", kodeWilayah: "530610", alamat: "Kecamatan Maronggela" },
  { nama: "Puskesmas Watumanu", kodeWilayah: "530611", alamat: "Kecamatan Watumanu" },
  { nama: "Puskesmas Dona", kodeWilayah: "530612", alamat: "Kecamatan Dona" },
  { nama: "Puskesmas Rawangkalo", kodeWilayah: "530613", alamat: "Kecamatan Rawangkalo" },
  { nama: "Puskesmas Lengkosambi", kodeWilayah: "530614", alamat: "Kecamatan Lengkosambi" },
  { nama: "Puskesmas Riung", kodeWilayah: "530615", alamat: "Kecamatan Riung" },
  { nama: "Puskesmas Waepana", kodeWilayah: "530616", alamat: "Kecamatan Waepana" },
  { nama: "Puskesmas Soa", kodeWilayah: "530617", alamat: "Kecamatan Soa" },
  { nama: "Puskesmas Radabata", kodeWilayah: "530618", alamat: "Kecamatan Radabata" },
  { nama: "Puskesmas Koeloda", kodeWilayah: "530619", alamat: "Kecamatan Koeloda" },
  { nama: "Puskesmas Inerie", kodeWilayah: "530620", alamat: "Kecamatan Inerie" },
  { nama: "Puskesmas Aimere", kodeWilayah: "530621", alamat: "Kecamatan Aimere" },
  { nama: "Puskesmas Kota", kodeWilayah: "530622", alamat: "Kecamatan Kota" },
  { nama: "Puskesmas Wolowio", kodeWilayah: "530623", alamat: "Kecamatan Wolowio" },
  { nama: "Puskesmas Surisina", kodeWilayah: "530624", alamat: "Kecamatan Surisina" },
  { nama: "Puskesmas Langa", kodeWilayah: "530625", alamat: "Kecamatan Langa" }
]

// Operator data sesuai data production (username dan namaLengkap dari screenshot)
const operatorData: Array<{ username: string; namaLengkap: string; puskesmasNama: string }> = [
  { username: "mangulewa", namaLengkap: "PKM_MANGULEWA", puskesmasNama: "Puskesmas Mangulewa" },
  { username: "laja", namaLengkap: "PKM_LAJA", puskesmasNama: "Puskesmas Laja" },
  { username: "boba", namaLengkap: "PKM_BOBA", puskesmasNama: "Puskesmas Boba" },
  { username: "natarandang", namaLengkap: "PKM_NATARANDANG", puskesmasNama: "Puskesmas Natarandang" },
  { username: "uluwae", namaLengkap: "PKM_ULUWAE", puskesmasNama: "Puskesmas Uluwae" },
  { username: "inelikaraya", namaLengkap: "PKM_INELIKA RAYA", puskesmasNama: "Puskesmas Inelika Raya" },
  { username: "watukapu", namaLengkap: "PKM_WATUKAPU", puskesmasNama: "Puskesmas Watukapu" },
  { username: "ngara", namaLengkap: "PKM_NGARA", puskesmasNama: "Puskesmas Ngara" },
  { username: "lindi", namaLengkap: "PKM_LINDI", puskesmasNama: "Puskesmas Lindi" },
  { username: "maronggela", namaLengkap: "PKM_MARONGGELA", puskesmasNama: "Puskesmas Maronggela" },
  { username: "watumanu", namaLengkap: "PKM_WATUMANU", puskesmasNama: "Puskesmas Watumanu" },
  { username: "dona", namaLengkap: "PKM_DONA", puskesmasNama: "Puskesmas Dona" },
  { username: "rawangkalo", namaLengkap: "PKM_RAWANGKALO", puskesmasNama: "Puskesmas Rawangkalo" },
  { username: "lengkosambi", namaLengkap: "PKM_LENGKOSAMBI", puskesmasNama: "Puskesmas Lengkosambi" },
  { username: "riung", namaLengkap: "PKM_RIUNG", puskesmasNama: "Puskesmas Riung" },
  { username: "waepana", namaLengkap: "PKM_WAEPANA", puskesmasNama: "Puskesmas Waepana" },
  { username: "pkm_soa", namaLengkap: "PKM_SOA", puskesmasNama: "Puskesmas Soa" },
  { username: "radabata", namaLengkap: "PKM_RADABATA", puskesmasNama: "Puskesmas Radabata" },
  { username: "koeloda", namaLengkap: "PKM_KOELODA", puskesmasNama: "Puskesmas Koeloda" },
  { username: "inerie", namaLengkap: "PKM_INERIE", puskesmasNama: "Puskesmas Inerie" },
  { username: "aimere", namaLengkap: "PKM_AIMERE", puskesmasNama: "Puskesmas Aimere" },
  { username: "kota", namaLengkap: "PKM_KOTA", puskesmasNama: "Puskesmas Kota" },
  { username: "wolowio", namaLengkap: "PKM_WOLOWIO", puskesmasNama: "Puskesmas Wolowio" },
  { username: "surisina", namaLengkap: "PKM_SURISINA", puskesmasNama: "Puskesmas Surisina" },
  { username: "langa", namaLengkap: "PKM_LANGA", puskesmasNama: "Puskesmas Langa" }
]

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

  // Buat Admin Dukcapil (sesuai data production)
  console.log("👤 Membuat Admin Dukcapil...")
  const adminPassword = "admin123"
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)
  
  await prisma.user.create({
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

  // Buat BPJS User
  console.log("🏥 Membuat User BPJS...")
  const bpjsPassword = "bpjs123"
  const hashedBpjsPassword = await bcrypt.hash(bpjsPassword, 10)
  
  await prisma.user.create({
    data: {
      username: "bpjs1",
      password: hashedBpjsPassword,
      namaLengkap: "Petugas BPJS Ngada",
      role: "BPJS",
      puskesmasId: null
    }
  })
  console.log(`✅ User BPJS berhasil dibuat`)
  console.log(`   Username: bpjs1`)
  console.log(`   Password: ${bpjsPassword}\n`)

  // Buat Operator untuk setiap Puskesmas (sesuai data production)
  console.log("👥 Membuat Operator Puskesmas...")
  console.log("─".repeat(60))
  
  const operatorAccounts: Array<{ username: string; password: string; namaLengkap: string; puskesmas: string }> = []
  
  const operators = await Promise.all(
    operatorData.map(async (op, index) => {
      const puskesmas = puskesmas.find(p => p.nama === op.puskesmasNama)
      if (!puskesmas) {
        console.log(`⚠️  Puskesmas tidak ditemukan: ${op.puskesmasNama}`)
        return null
      }

      // Password: nama puskesmas (tanpa "Puskesmas ") + 123
      const password = `${puskesmas.nama.replace("Puskesmas ", "").toLowerCase()}123`
      
      operatorAccounts.push({
        username: op.username,
        password,
        namaLengkap: op.namaLengkap,
        puskesmas: puskesmas.nama
      })
      
      const hashedPassword = await bcrypt.hash(password, 10)
      return prisma.user.create({
        data: {
          username: op.username,
          password: hashedPassword,
          namaLengkap: op.namaLengkap,
          role: "OPERATOR",
          puskesmasId: puskesmas.id
        }
      })
    })
  )

  // Tampilkan daftar akun operator
  console.log("📋 DAFTAR AKUN OPERATOR PUSKESMAS NGADA:")
  console.log("─".repeat(60))
  
  operatorAccounts.forEach((acc) => {
    console.log(`   ${acc.username.padEnd(18)} / ${acc.password.padEnd(22)} (${acc.puskesmas})`)
  })
  
  console.log("─".repeat(60))
  console.log(`✅ ${operatorAccounts.length} Operator berhasil dibuat\n`)

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
      createdBy: (await prisma.user.findFirst({ where: { username: 'mangulewa' } }))!.id
    },
    {
      nikIbu: "5306025678900002",
      namaIbu: "AGUSTINA WAE",
      namaAyah: "PAULUS BEO",
      namaBayi: "THERESIA BEO",
      tanggalLahir: new Date("2024-01-18"),
      tempatLahir: "PUSKESMAS LAJA",
      jenisKelamin: "PEREMPUAN",
      status: "VERIFIED",
      puskesmasId: puskesmas[1].id,
      createdBy: (await prisma.user.findFirst({ where: { username: 'laja' } }))!.id
    },
    {
      nikIbu: "5306036789010003",
      namaIbu: "ROSMINI DHAKI",
      namaAyah: "MATEOS GEBA",
      namaBayi: "YOHANES GEBA",
      tanggalLahir: new Date("2024-01-20"),
      tempatLahir: "PUSKESMAS BOBA",
      jenisKelamin: "LAKI_LAKI",
      status: "VERIFIED",
      puskesmasId: puskesmas[2].id,
      createdBy: (await prisma.user.findFirst({ where: { username: 'boba' } }))!.id
    },
    {
      nikIbu: "5306011234560004",
      namaIbu: "KATARINA REBO",
      namaAyah: "PETRUS MBOE",
      namaBayi: "ANASTASIA MBOE",
      tanggalLahir: new Date("2024-02-05"),
      tempatLahir: "RSUD BAJAWA",
      jenisKelamin: "PEREMPUAN",
      status: "PENDING",
      puskesmasId: puskesmas[0].id,
      createdBy: (await prisma.user.findFirst({ where: { username: 'mangulewa' } }))!.id
    },
    {
      nikIbu: "5306049876540005",
      namaIbu: "YULIANA MERE",
      namaAyah: "DOMINIKUS WUJA",
      namaBayi: "MARELIN WUJA",
      tanggalLahir: new Date("2024-02-10"),
      tempatLahir: "PUSKESMAS NATARANDANG",
      jenisKelamin: "PEREMPUAN",
      status: "PENDING",
      puskesmasId: puskesmas[3].id,
      createdBy: (await prisma.user.findFirst({ where: { username: 'natarandang' } }))!.id
    }
  ]

  const birthRecords = await Promise.all(
    sampleBirthRecords.map((record) =>
      prisma.birthRecord.create({ data: record })
    )
  )
  console.log(`✅ ${birthRecords.length} data kelahiran contoh berhasil dibuat\n`)

  // Update NIK bayi untuk 2 data
  console.log("📝 Menambahkan NIK Bayi untuk data contoh...")
  await prisma.birthRecord.update({
    where: { id: birthRecords[0].id },
    data: { 
      nikBayi: "5306010101010001",
      nikBayiUpdatedAt: new Date("2024-03-01")
    }
  })
  await prisma.birthRecord.update({
    where: { id: birthRecords[1].id },
    data: { 
      nikBayi: "5306020202020002",
      nikBayiUpdatedAt: new Date("2024-03-05")
    }
  })
  console.log("✅ 2 data telah diberi NIK Bayi\n")

  console.log("=".repeat(60))
  console.log("🎉 SEEDING SELESAI!")
  console.log("=".repeat(60))
  console.log("\n📋 RINGKASAN AKUN LOGIN:")
  console.log("─".repeat(60))
  console.log("ADMIN DUKCAPIL:")
  console.log("   Username: admin_dukcapil")
  console.log("   Password: admin123")
  console.log("─".repeat(60))
  console.log("BPJS:")
  console.log("   Username: bpjs1")
  console.log("   Password: bpjs123")
  console.log("─".repeat(60))
  console.log("OPERATOR PUSKESMAS (25 akun):")
  console.log("   Lihat daftar lengkap di atas")
  console.log("─".repeat(60))
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
