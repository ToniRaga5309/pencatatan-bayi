// API untuk mendapatkan daftar puskesmas (Admin)
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const puskesmasList = await db.puskesmas.findMany({
      select: { id: true, nama: true, kodeWilayah: true },
      orderBy: { nama: "asc" }
    })

    return NextResponse.json(puskesmasList)
  } catch (error) {
    console.error("Error fetching puskesmas:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
