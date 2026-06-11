// API untuk download file pendukung oleh Admin
// Mengembalikan file asli (binary) dengan Content-Type dan Content-Disposition yang sesuai
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params
    const user = await getCurrentUser()

    // Hanya ADMIN yang bisa download file
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Ambil file dari database (termasuk fileData)
    const file = await db.birthRecordFile.findUnique({
      where: { id: fileId },
      include: {
        birthRecord: {
          select: { id: true, namaBayi: true },
        },
        uploader: {
          select: { id: true, namaLengkap: true },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 })
    }

    // Pastikan file milik birth record yang diminta
    if (file.birthRecordId !== id) {
      return NextResponse.json({ error: "File tidak terkait dengan data ini" }, { status: 400 })
    }

    // Konversi base64 kembali ke Buffer
    const buffer = Buffer.from(file.fileData, "base64")

    // Tentukan Content-Disposition filename
    const contentDisposition = `attachment; filename="${encodeURIComponent(file.fileName)}"`

    // Return file dengan header yang sesuai
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.fileMime,
        "Content-Disposition": contentDisposition,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error downloading birth record file:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}