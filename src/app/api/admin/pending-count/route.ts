// API untuk mendapatkan jumlah data pending (Admin)
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const [pendingCount, withoutNikCount] = await Promise.all([
      // Total data PENDING
      db.birthRecord.count({
        where: {
          isDeleted: false,
          status: "PENDING",
        },
      }),
      // Total data VERIFIED tanpa NIK Bayi
      db.birthRecord.count({
        where: {
          isDeleted: false,
          status: "VERIFIED",
          nikBayi: null,
        },
      }),
    ])

    return NextResponse.json({
      pendingCount,
      withoutNikCount,
    })
  } catch (error) {
    console.error("Error fetching pending count:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
