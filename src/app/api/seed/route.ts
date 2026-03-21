import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

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

function generatePassword(namaPuskesmas: string): string {
  const namaSingkat = namaPuskesmas.replace("Puskesmas ", "")
  const namaFormatted = namaSingkat.charAt(0).toUpperCase() + 
                        namaSingkat.slice(1).toLowerCase()
  const nomor = namaSingkat.length.toString().padStart(3, "0")
  return `${namaFormatted}${nomor}!`
}

function generateUsername(namaPuskesmas: string): string {
  const namaSingkat = namaPuskesmas.replace("Puskesmas ", "")
  return namaSingkat.toLowerCase().replace(/\s+/g, "_")
}

export async function GET(request: Request) {
  try {
    // Cek secret key untuk keamanan
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    
    if (secret !== process.env.NEXTAUTH_SECRET && secret !== 'seed-ngada-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log("🌱 Memulai seeding database...")
    
    // Hapus data yang ada
    console.log("🗑️ Membersihkan data lama...")
    await db.auditLog.deleteMany()
    await db.birthRecord.deleteMany()
    await db.user.deleteMany()
    await db.puskesmas.deleteMany()

    // Buat data Puskesmas
    console.log("🏥 Membuat data Puskesmas Ngada...")
    const puskesmas = await Promise.all(
      puskesmasData.map((p) =>
        db.puskesmas.create({ data: p })
      )
    )

    // Buat Admin Dukcapil
    console.log("👤 Membuat Admin Dukcapil...")
    const adminPassword = "AdminNgada2024!"
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)
    
    await db.user.create({
      data: {
        username: "admin_dukcapil",
        password: hashedAdminPassword,
        namaLengkap: "Admin Dukcapil Ngada",
        role: "ADMIN",
        puskesmasId: null
      }
    })

    // Buat Operator untuk setiap Puskesmas
    console.log("👥 Membuat Operator Puskesmas...")
    const operatorAccounts: Array<{ username: string; password: string; puskesmas: string }> = []
    
    await Promise.all(
      puskesmas.map(async (p) => {
        const username = generateUsername(p.nama)
        const password = generatePassword(p.nama)
        const namaLengkap = `Operator ${p.nama.replace("Puskesmas ", "")}`
        
        operatorAccounts.push({
          username,
          password,
          puskesmas: p.nama
        })
        
        const hashedPassword = await bcrypt.hash(password, 10)
        return db.user.create({
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
        createdBy: (await db.user.findFirst({ where: { username: 'bajawa' } }))!.id
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
        createdBy: (await db.user.findFirst({ where: { username: 'mataloko' } }))!.id
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
        createdBy: (await db.user.findFirst({ where: { username: 'aimere' } }))!.id
      }
    ]

    await Promise.all(
      sampleBirthRecords.map((record) =>
        db.birthRecord.create({ data: record })
      )
    )

    console.log("🎉 Seeding selesai!")

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      accounts: {
        admin: {
          username: "admin_dukcapil",
          password: "AdminNgada2024!"
        },
        operators: operatorAccounts
      }
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ 
      error: 'Seed failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
