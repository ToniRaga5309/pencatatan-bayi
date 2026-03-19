// API untuk mendapatkan statistik dashboard admin
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const [totalAll, totalPending, totalVerified, totalRejected, puskesmasList] = await Promise.all([
      db.birthRecord.count({ where: { isDeleted: false } }),
      db.birthRecord.count({ where: { status: "PENDING", isDeleted: false } }),
      db.birthRecord.count({ where: { status: "VERIFIED", isDeleted: false } }),
      db.birthRecord.count({ where: { status: "REJECTED", isDeleted: false } }),
      db.puskesmas.findMany({
        select: { id: true, nama: true },
        orderBy: { nama: "asc" }
      })
    ])

    return NextResponse.json({
      totalAll,
      totalPending,
      totalVerified,
      totalRejected,
      puskesmasList
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
