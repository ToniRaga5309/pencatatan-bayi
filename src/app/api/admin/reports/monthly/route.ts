// API endpoint untuk laporan bulanan
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getNamaBulan } from "@/lib/utils-common"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")
    const monthParam = searchParams.get("month")

    const now = new Date()
    const year = yearParam ? parseInt(yearParam) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam) - 1 : now.getMonth() // JS months are 0-indexed

    // Validasi
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json({ error: "Tahun tidak valid" }, { status: 400 })
    }
    if (isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json({ error: "Bulan tidak valid" }, { status: 400 })
    }

    // Tanggal awal dan akhir bulan
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    // Ambil semua data kelahiran di bulan tersebut
    const records = await db.birthRecord.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        isDeleted: false
      },
      include: {
        puskesmas: {
          select: { nama: true }
        },
        creator: {
          select: { namaLengkap: true }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    // Hitung statistik
    const totalRecords = records.length
    const totalVerified = records.filter(r => r.status === "VERIFIED").length
    const totalPending = records.filter(r => r.status === "PENDING").length
    const totalRejected = records.filter(r => r.status === "REJECTED").length
    const totalWithNik = records.filter(r => r.nikBayi !== null && r.nikBayi !== "").length
    const totalWithoutNik = totalRecords - totalWithNik

    // Distribusi per puskesmas
    const puskesmasStats = records.reduce((acc, record) => {
      const nama = record.puskesmas.nama
      if (!acc[nama]) {
        acc[nama] = { nama, jumlah: 0, verified: 0, pending: 0 }
      }
      acc[nama].jumlah++
      if (record.status === "VERIFIED") acc[nama].verified++
      if (record.status === "PENDING") acc[nama].pending++
      return acc
    }, {} as Record<string, { nama: string; jumlah: number; verified: number; pending: number }>)

    // Distribusi per jenis kelamin
    const totalLakiLaki = records.filter(r => r.jenisKelamin === "LAKI_LAKI").length
    const totalPerempuan = records.filter(r => r.jenisKelamin === "PEREMPUAN").length

    return NextResponse.json({
      period: {
        year,
        month: month + 1,
        monthName: getNamaBulan(month),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      summary: {
        totalRecords,
        totalVerified,
        totalPending,
        totalRejected,
        totalWithNik,
        totalWithoutNik,
        totalLakiLaki,
        totalPerempuan
      },
      puskesmasStats: Object.values(puskesmasStats).sort((a, b) => b.jumlah - a.jumlah),
      records: records.map(r => ({
        id: r.id,
        namaBayi: r.namaBayi,
        nikIbu: r.nikIbu,
        namaIbu: r.namaIbu,
        namaAyah: r.namaAyah,
        nikBayi: r.nikBayi,
        jenisKelamin: r.jenisKelamin,
        tanggalLahir: r.tanggalLahir,
        tempatLahir: r.tempatLahir,
        beratBadan: r.beratBadan,
        panjangBadan: r.panjangBadan,
        status: r.status,
        alasanPenolakan: r.alasanPenolakan,
        puskesmas: r.puskesmas.nama,
        creator: r.creator.namaLengkap,
        createdAt: r.createdAt
      }))
    })
  } catch (error) {
    console.error("Error generating monthly report:", error)
    return NextResponse.json(
      { error: "Gagal membuat laporan bulanan" },
      { status: 500 }
    )
  }
}
