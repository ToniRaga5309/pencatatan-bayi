// API untuk statistik dashboard BPJS
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "BPJS") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const [totalRecords, totalWithNik, totalWithoutNik, puskesmasList] = await Promise.all([
      // Total semua data aktif
      db.birthRecord.count({
        where: { isDeleted: false }
      }),
      // Total data dengan NIK bayi
      db.birthRecord.count({
        where: {
          isDeleted: false,
          nikBayi: { not: null }
        }
      }),
      // Total data tanpa NIK bayi
      db.birthRecord.count({
        where: {
          isDeleted: false,
          nikBayi: null
        }
      }),
      // Daftar puskesmas
      db.puskesmas.findMany({
        select: { id: true, nama: true },
        orderBy: { nama: "asc" }
      })
    ])

    return NextResponse.json({
      totalRecords,
      totalWithNik,
      totalWithoutNik,
      puskesmasList
    })
  } catch (error) {
    console.error("Error fetching BPJS stats:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
