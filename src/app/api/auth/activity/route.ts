// API untuk aktivitas terakhir user (GET)
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

// GET: Ambil 5 audit log terakhir untuk user saat ini
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 401 })
    }

    const activities = await db.auditLog.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        entity: true,
        details: true,
        createdAt: true,
      },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
