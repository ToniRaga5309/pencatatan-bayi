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

    const [totalAll, totalPending, totalVerified, totalRejected, totalWithNik, puskesmasList] = await Promise.all([
      // Total semua data
      db.birthRecord.count({ 
        where: { isDeleted: false } 
      }),
      // Total data pending
      db.birthRecord.count({ 
        where: { 
          isDeleted: false, 
          status: "PENDING" 
        } 
      }),
      // Total data verified
      db.birthRecord.count({ 
        where: { 
          isDeleted: false, 
          status: "VERIFIED" 
        } 
      }),
      // Total data rejected
      db.birthRecord.count({ 
        where: { 
          isDeleted: false, 
          status: "REJECTED" 
        } 
      }),
      // Total data dengan NIK bayi
      db.birthRecord.count({ 
        where: { 
          isDeleted: false, 
          nikBayi: { not: null } 
        } 
      }),
      // Daftar puskesmas
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
      totalWithNik,
      puskesmasList
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
