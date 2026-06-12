// API untuk melihat daftar file pendukung milik birth record (Admin)
// Mengembalikan metadata saja (tanpa fileData) termasuk nama uploader
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    // Hanya ADMIN yang bisa mengakses
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek apakah birth record ada
    const record = await db.birthRecord.findFirst({
      where: { id, isDeleted: false },
      select: { id: true },
    })

    if (!record) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    // Ambil daftar file (metadata saja, tanpa fileData), termasuk nama uploader
    const files = await db.birthRecordFile.findMany({
      where: { birthRecordId: id },
      select: {
        id: true,
        fileType: true,
        fileName: true,
        fileMime: true,
        fileSize: true,
        createdAt: true,
        uploadedBy: true,
        uploader: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      success: true,
      data: files,
    })
  } catch (error) {
    console.error("Error listing birth record files (admin):", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}