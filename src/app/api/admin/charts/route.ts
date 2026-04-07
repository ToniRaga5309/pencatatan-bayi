// API untuk data chart admin dashboard
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const currentYear = new Date().getFullYear()

    // Monthly birth records for current year
    const monthlyRecords = await db.birthRecord.groupBy({
      by: ["createdAt"],
      where: {
        isDeleted: false,
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1)
        }
      },
      _count: true
    })

    // Aggregate by month
    const monthlyCounts: Record<number, number> = {}
    for (let m = 0; m < 12; m++) {
      monthlyCounts[m] = 0
    }
    for (const record of monthlyRecords) {
      const month = new Date(record.createdAt).getMonth()
      monthlyCounts[month] += record._count
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
    ]

    const monthlyData = monthNames.map((name, index) => ({
      month: name,
      jumlah: monthlyCounts[index]
    }))

    // Distribution per Puskesmas
    const puskesmasDistribution = await db.birthRecord.groupBy({
      by: ["puskesmasId"],
      where: {
        isDeleted: false
      },
      _count: true
    })

    const puskesmasIds = puskesmasDistribution.map(p => p.puskesmasId)
    const puskesmasList = puskesmasIds.length > 0
      ? await db.puskesmas.findMany({
          where: { id: { in: puskesmasIds } },
          select: { id: true, nama: true }
        })
      : []

    const puskesmasMap = new Map(puskesmasList.map(p => [p.id, p.nama]))

    const distributionData = puskesmasDistribution
      .map(item => ({
        nama: puskesmasMap.get(item.puskesmasId) || "Tidak Diketahui",
        jumlah: item._count
      }))
      .sort((a, b) => b.jumlah - a.jumlah)

    return NextResponse.json({
      monthlyData,
      distributionData
    })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
