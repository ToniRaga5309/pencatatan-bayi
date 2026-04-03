// API Analytics untuk Admin - Data kelahiran dengan date range filter
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    // Default to current year
    const currentYear = new Date().getFullYear()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(currentYear, 0, 1)
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(currentYear, 11, 31, 23, 59, 59, 999)

    const baseWhere = {
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
    ]

    // 1. Monthly Trend (total, verified, rejected, pending)
    const monthlyRecords = await db.birthRecord.groupBy({
      by: ["createdAt", "status"],
      where: baseWhere,
      _count: true
    })

    const monthlyTrend = monthNames.map((month, index) => {
      const recordsInMonth = monthlyRecords.filter((r) => {
        const d = new Date(r.createdAt)
        return d.getMonth() === index && d.getFullYear() === (startDate.getFullYear() || currentYear)
      })

      const total = recordsInMonth.reduce((sum, r) => sum + r._count, 0)
      const verified = recordsInMonth.filter((r) => r.status === "VERIFIED").reduce((s, r) => s + r._count, 0)
      const rejected = recordsInMonth.filter((r) => r.status === "REJECTED").reduce((s, r) => s + r._count, 0)
      const pending = recordsInMonth.filter((r) => r.status === "PENDING").reduce((s, r) => s + r._count, 0)

      return { month, total, verified, rejected, pending }
    })

    // 2. Gender Distribution
    const genderRecords = await db.birthRecord.groupBy({
      by: ["jenisKelamin"],
      where: baseWhere,
      _count: true
    })

    const genderDistribution = genderRecords.map((r) => ({
      gender: r.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      count: r._count
    }))

    // 3. Puskesmas Ranking
    const puskesmasRecords = await db.birthRecord.groupBy({
      by: ["puskesmasId"],
      where: baseWhere,
      _count: true
    })

    const puskesmasIds = puskesmasRecords.map((p) => p.puskesmasId)
    const puskesmasList = puskesmasIds.length > 0
      ? await db.puskesmas.findMany({
          where: { id: { in: puskesmasIds } },
          select: { id: true, nama: true }
        })
      : []

    const puskesmasMap = new Map(puskesmasList.map((p) => [p.id, p.nama]))

    const puskesmasRanking = puskesmasRecords
      .map((item) => ({
        nama: puskesmasMap.get(item.puskesmasId) || "Tidak Diketahui",
        count: item._count
      }))
      .sort((a, b) => b.count - a.count)

    // 4. NIK Progress (monthly)
    const nikRecords = await db.birthRecord.findMany({
      where: baseWhere,
      select: {
        createdAt: true,
        nikBayi: true
      }
    })

    const nikProgress = monthNames.map((month, index) => {
      const recordsInMonth = nikRecords.filter((r) => {
        const d = new Date(r.createdAt)
        return d.getMonth() === index && d.getFullYear() === (startDate.getFullYear() || currentYear)
      })

      const withNik = recordsInMonth.filter((r) => r.nikBayi !== null && r.nikBayi !== "").length
      const withoutNik = recordsInMonth.length - withNik

      return { month, withNik, withoutNik }
    })

    // 5. Summary
    const totalRecords = await db.birthRecord.count({ where: baseWhere })
    const verifiedRecords = await db.birthRecord.count({
      where: { ...baseWhere, status: "VERIFIED" }
    })
    const withNikRecords = await db.birthRecord.count({
      where: { ...baseWhere, nikBayi: { not: null } }
    })

    // Calculate the number of unique months with data in the period
    const uniqueMonths = new Set(
      monthlyRecords.map((r) => {
        const d = new Date(r.createdAt)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )
    const activeMonths = Math.max(uniqueMonths.size, 1)

    const summary = {
      total: totalRecords,
      avgPerMonth: Math.round((totalRecords / activeMonths) * 10) / 10,
      verificationRate: totalRecords > 0 ? Math.round((verifiedRecords / totalRecords) * 100) : 0,
      nikRate: totalRecords > 0 ? Math.round((withNikRecords / totalRecords) * 100) : 0
    }

    return NextResponse.json({
      monthlyTrend,
      genderDistribution,
      puskesmasRanking,
      nikProgress,
      summary
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
