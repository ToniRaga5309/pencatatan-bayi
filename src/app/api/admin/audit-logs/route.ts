// API untuk mendapatkan audit logs (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getAuditLogs } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const action = url.searchParams.get("action") || undefined
    const entity = url.searchParams.get("entity") || undefined
    const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate")!) : undefined
    const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate")!) : undefined

    const skip = (page - 1) * limit

    const { logs, total } = await getAuditLogs({
      skip,
      take: limit,
      action,
      entity,
      startDate,
      endDate,
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
