import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    // Check authorization - should be called only once during setup
    const body = await request.json().catch(() => ({}))
    const { secret } = body
    
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("🌱 Memulai seeding database...")

    // Cek apakah sudah ada data
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        success: true,
        message: "Database sudah memiliki data. Seeding dilewati.",
        credentials: {
          admin: { username: "admin", password: "password123" },
          operator: { username: "operator1", password: "password123" }
        }
      })
    }

    // Buat data Puskesmas
    const puskesmasData = [
      { nama: "Puskesmas Kecamatan Gambir", kodeWilayah: "317101", alamat: "Jl. Gambir No. 1, Jakarta Pusat" },
      { nama: "Puskesmas Kecamatan Tanah Abang", kodeWilayah: "317102", alamat: "Jl. Tanah Abang No. 15, Jakarta Pusat" },
      { nama: "Puskesmas Kecamatan Menteng", kodeWilayah: "317103", alamat: "Jl. Menteng Raya No. 20, Jakarta Pusat" },
      { nama: "Puskesmas Kecamatan Senen", kodeWilayah: "317104", alamat: "Jl. Senen Raya No. 45, Jakarta Pusat" },
      { nama: "Puskesmas Kecamatan Cempaka Putih", kodeWilayah: "317105", alamat: "Jl. Cempaka Putih No. 10, Jakarta Pusat" }
    ]

    const puskesmas = await Promise.all(
      puskesmasData.map((p) => db.puskesmas.create({ data: p }))
    )
    console.log(`✅ ${puskesmas.length} Puskesmas berhasil dibuat`)

    // Hash password default
    const hashedPassword = await bcrypt.hash("password123", 10)

    // Buat Admin Dukcapil
    const admin = await db.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        namaLengkap: "Admin Dukcapil",
        role: "ADMIN",
        puskesmasId: null
      }
    })
    console.log("✅ Admin Dukcapil berhasil dibuat")

    // Buat Operator untuk setiap Puskesmas
    const operators = await Promise.all(
      puskesmas.map((p, index) =>
        db.user.create({
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

    // Buat contoh data kelahiran
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

    await Promise.all(
      sampleBirthRecords.map((record) => db.birthRecord.create({ data: record }))
    )
    console.log("✅ Data kelahiran contoh berhasil dibuat")

    return NextResponse.json({
      success: true,
      message: "Seeding berhasil!",
      credentials: {
        admin: { username: "admin", password: "password123" },
        operator: { username: "operator1", password: "password123" }
      }
    })
  } catch (error) {
    console.error("Error saat seeding:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat seeding", details: String(error) },
      { status: 500 }
    )
  }
}
