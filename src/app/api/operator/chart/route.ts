// API untuk data chart operator (bulanan per puskesmas)
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const currentYear = new Date().getFullYear()

    // Get all records for this puskesmas in current year
    const records = await db.birthRecord.findMany({
      where: {
        puskesmasId: user.puskesmasId,
        isDeleted: false,
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1)
        }
      },
      select: { createdAt: true }
    })

    // Aggregate by month
    const monthlyCounts: Record<number, number> = {}
    for (let m = 0; m < 12; m++) {
      monthlyCounts[m] = 0
    }
    for (const record of records) {
      const month = new Date(record.createdAt).getMonth()
      monthlyCounts[month]++
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
    ]

    const monthlyData = monthNames.map((name, index) => ({
      month: name,
      jumlah: monthlyCounts[index]
    }))

    return NextResponse.json(monthlyData)
  } catch (error) {
    console.error("Error fetching operator chart data:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
