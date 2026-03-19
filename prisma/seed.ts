// Seed data untuk Sistem Pencatatan Nama Bayi Baru Lahir
// Jalankan dengan: bun run prisma/seed.ts

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Memulai seeding database...")

  // Hapus data yang ada
  console.log("🗑️  Membersihkan data lama...")
  await prisma.auditLog.deleteMany()
  await prisma.birthRecord.deleteMany()
  await prisma.user.deleteMany()
  await prisma.puskesmas.deleteMany()

  // Buat data Puskesmas
  console.log("🏥 Membuat data Puskesmas...")
  const puskesmasData = [
    { nama: "Puskesmas Kecamatan Gambir", kodeWilayah: "317101", alamat: "Jl. Gambir No. 1, Jakarta Pusat" },
    { nama: "Puskesmas Kecamatan Tanah Abang", kodeWilayah: "317102", alamat: "Jl. Tanah Abang No. 15, Jakarta Pusat" },
    { nama: "Puskesmas Kecamatan Menteng", kodeWilayah: "317103", alamat: "Jl. Menteng Raya No. 20, Jakarta Pusat" },
    { nama: "Puskesmas Kecamatan Senen", kodeWilayah: "317104", alamat: "Jl. Senen Raya No. 45, Jakarta Pusat" },
    { nama: "Puskesmas Kecamatan Cempaka Putih", kodeWilayah: "317105", alamat: "Jl. Cempaka Putih No. 10, Jakarta Pusat" }
  ]

  const puskesmas = await Promise.all(
    puskesmasData.map((p) =>
      prisma.puskesmas.create({ data: p })
    )
  )
  console.log(`✅ ${puskesmas.length} Puskesmas berhasil dibuat`)

  // Hash password default
  const hashedPassword = await bcrypt.hash("password123", 10)

  // Buat Admin Dukcapil
  console.log("👤 Membuat Admin Dukcapil...")
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
      namaLengkap: "Admin Dukcapil",
      role: "ADMIN",
      puskesmasId: null
    }
  })
  console.log(`✅ Admin Dukcapil berhasil dibuat (username: admin, password: password123)`)

  // Buat Operator untuk setiap Puskesmas
  console.log("👥 Membuat Operator Puskesmas...")
  const operators = await Promise.all(
    puskesmas.map((p, index) =>
      prisma.user.create({
        data: {
          username: `operator${index + 1}`,
          password: hashedPassword,
          namaLengkap: `Operator ${p.nama.replace("Puskesmas Kecamatan ", "")}`,
          role: "OPERATOR",
          puskesmasId: p.id
        }
      })
    )
  )
  console.log(`✅ ${operators.length} Operator berhasil dibuat`)
  console.log("   Username: operator1, operator2, ... | Password: password123")

  // Buat contoh data kelahiran
  console.log("👶 Membuat data kelahiran contoh...")
  const sampleBirthRecords = [
    {
      nikIbu: "3171014567890001",
      namaIbu: "SITI NURHALIZA",
      namaAyah: "AHMAD FAUZI",
      namaBayi: "MUHAMMAD RIZKY",
      tanggalLahir: new Date("2024-01-15"),
      tempatLahir: "RSUD TARUMANEGARA",
      jenisKelamin: "LAKI_LAKI",
      status: "VERIFIED",
      puskesmasId: puskesmas[0].id,
      createdBy: operators[0].id,
      verifiedBy: admin.id,
      verifiedAt: new Date()
    },
    {
      nikIbu: "3171025678900002",
      namaIbu: "DEWI SARTIKA",
      namaAyah: "BUDI SANTOSO",
      namaBayi: "PUTRI ANGGRAINI",
      tanggalLahir: new Date("2024-01-18"),
      tempatLahir: "RS HARAPAN KITA",
      jenisKelamin: "PEREMPUAN",
      status: "PENDING",
      puskesmasId: puskesmas[1].id,
      createdBy: operators[1].id
    },
    {
      nikIbu: "3171036789010003",
      namaIbu: "RINA MARLENA",
      namaAyah: "DEDI KURNIAWAN",
      namaBayi: "RAFLI ADRIAN",
      tanggalLahir: new Date("2024-01-20"),
      tempatLahir: "RS ABADI",
      jenisKelamin: "LAKI_LAKI",
      status: "PENDING",
      puskesmasId: puskesmas[2].id,
      createdBy: operators[2].id
    }
  ]

  const birthRecords = await Promise.all(
    sampleBirthRecords.map((record) =>
      prisma.birthRecord.create({ data: record })
    )
  )
  console.log(`✅ ${birthRecords.length} data kelahiran contoh berhasil dibuat`)

  console.log("\n" + "=".repeat(50))
  console.log("🎉 Seeding selesai!")
  console.log("=".repeat(50))
  console.log("\n📋 Akun Login:")
  console.log("   Admin:    username: admin     | password: password123")
  console.log("   Operator: username: operator1 | password: password123")
  console.log("=".repeat(50))
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
