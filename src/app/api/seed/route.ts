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
  return `${namaSingkat.toLowerCase()}123`
}

function generateUsername(namaPuskesmas: string): string {
  const namaSingkat = namaPuskesmas.replace("Puskesmas ", "")
  return namaSingkat.toLowerCase().replace(/\s+/g, "")
}

export async function GET(request: Request) {
  try {
    // Cek secret key untuk keamanan
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    
    if (secret !== process.env.NEXTAUTH_SECRET) {
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
    const adminPassword = "admin123"
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)
    
    await db.user.create({
      data: {
        username: "admin",
        password: hashedAdminPassword,
        namaLengkap: "Admin Dukcapil Ngada",
        role: "ADMIN",
        puskesmasId: null
      }
    })

    // Buat BPJS User
    console.log("🏥 Membuat User BPJS...")
    const bpjsPassword = "bpjs123"
    const hashedBpjsPassword = await bcrypt.hash(bpjsPassword, 10)
    
    await db.user.create({
      data: {
        username: "bpjs1",
        password: hashedBpjsPassword,
        namaLengkap: "Petugas BPJS Ngada",
        role: "BPJS",
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
            namaLengkap: `Operator ${p.nama.replace("Puskesmas ", "")}`,
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
        createdBy: (await db.user.findFirst({ where: { username: 'bajawa' } }))!.id
      },
      {
        nikIbu: "5306049876540005",
        namaIbu: "YULIANA MERE",
        namaAyah: "DOMINIKUS WUJA",
        namaBayi: "MARELIN WUJA",
        tanggalLahir: new Date("2024-02-10"),
        tempatLahir: "PUSKESMAS BOAWAE",
        jenisKelamin: "PEREMPUAN",
        status: "PENDING",
        puskesmasId: puskesmas[3].id,
        createdBy: (await db.user.findFirst({ where: { username: 'boawae' } }))!.id
      }
    ]

    const birthRecords = await Promise.all(
      sampleBirthRecords.map((record) =>
        db.birthRecord.create({ data: record })
      )
    )

    // Update NIK bayi untuk 2 data
    await db.birthRecord.update({
      where: { id: birthRecords[0].id },
      data: { 
        nikBayi: "5306010101010001",
        nikBayiUpdatedAt: new Date("2024-03-01")
      }
    })
    await db.birthRecord.update({
      where: { id: birthRecords[1].id },
      data: { 
        nikBayi: "5306020202020002",
        nikBayiUpdatedAt: new Date("2024-03-05")
      }
    })

    console.log("🎉 Seeding selesai!")

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      accounts: {
        admin: {
          username: "admin",
          password: "admin123"
        },
        bpjs: {
          username: "bpjs1",
          password: "bpjs123"
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
