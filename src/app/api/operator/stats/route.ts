// API untuk mendapatkan statistik dashboard operator
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      )
    }

    // Mendapatkan tanggal awal dan akhir bulan ini
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Query statistik berdasarkan puskesmas user
    // Semua data langsung VERIFIED, tidak ada PENDING atau REJECTED
    const [totalBulanIni, totalVerified, totalAllTime] = await Promise.all([
      // Total data bulan ini
      db.birthRecord.count({
        where: {
          puskesmasId: user.puskesmasId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          isDeleted: false
        }
      }),
      // Total verified (data aktif)
      db.birthRecord.count({
        where: {
          puskesmasId: user.puskesmasId,
          status: "VERIFIED",
          isDeleted: false
        }
      }),
      // Total semua waktu
      db.birthRecord.count({
        where: {
          puskesmasId: user.puskesmasId,
          isDeleted: false
        }
      })
    ])

    return NextResponse.json({
      totalBulanIni,
      totalVerified,
      totalAllTime
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
