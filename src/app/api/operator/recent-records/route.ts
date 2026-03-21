// API untuk mendapatkan data terbaru operator
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

    // Ambil 5 data terbaru (semua sudah VERIFIED)
    const records = await db.birthRecord.findMany({
      where: {
        puskesmasId: user.puskesmasId,
        isDeleted: false
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5,
      select: {
        id: true,
        namaBayi: true,
        namaIbu: true,
        tanggalLahir: true,
        createdAt: true
      }
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching recent records:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
