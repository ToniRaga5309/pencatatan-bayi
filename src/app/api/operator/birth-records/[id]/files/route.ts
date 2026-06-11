// API untuk upload, list, dan hapus file pendukung (surat keterangan lahir & kartu keluarga)
// Hanya OPERATOR yang memiliki record (via puskesmasId) atau ADMIN yang bisa mengakses
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { ensureSchemaSynced } from "@/lib/schema-sync"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"]

// GET: List file metadata untuk birth record tertentu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || (user.role !== "OPERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek apakah record ada
    const record = await db.birthRecord.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, puskesmasId: true },
    })

    if (!record) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    // Operator hanya bisa akses record dari puskesmas sendiri
    if (user.role === "OPERATOR" && !user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    if (user.role === "OPERATOR" && record.puskesmasId !== user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke data ini" }, { status: 403 })
    }

    // Ambil file metadata (tanpa fileData)
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
    console.error("Error listing birth record files:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}

// POST: Upload file pendukung (surat keterangan lahir & kartu keluarga)
// Hanya OPERATOR yang memiliki record yang bisa upload
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchemaSynced()

    const { id } = await params
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    if (!user.puskesmasId) {
      return NextResponse.json({ error: "Operator tidak terikat ke puskesmas" }, { status: 403 })
    }

    // Cek apakah record ada dan milik operator
    const record = await db.birthRecord.findFirst({
      where: { id, isDeleted: false, puskesmasId: user.puskesmasId },
    })

    if (!record) {
      return NextResponse.json({ error: "Data tidak ditemukan atau tidak memiliki akses" }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const suratKelahiran = formData.get("suratKelahiran") as File | null
    const kartuKeluarga = formData.get("kartuKeluarga") as File | null

    // Minimal salah satu file harus ada
    if (!suratKelahiran && !kartuKeluarga) {
      return NextResponse.json(
        { error: "Minimal satu file harus diunggah (surat keterangan lahir atau kartu keluarga)" },
        { status: 400 }
      )
    }

    // Helper untuk validasi dan proses file
    async function processFile(file: File, fileType: string) {
      // Validasi tipe MIME
      const isValidMime = ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))
      if (!isValidMime) {
        return {
          error: `Tipe file ${file.name} tidak didukung. Hanya gambar dan PDF yang diperbolehkan.`,
        }
      }

      // Validasi ukuran file (5MB)
      if (file.size > MAX_FILE_SIZE) {
        return {
          error: `File ${file.name} melebihi batas 5MB.`,
        }
      }

      // Konversi file ke base64
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")

      return {
        data: {
          fileType,
          fileName: file.name,
          fileMime: file.type,
          fileSize: file.size,
          fileData: base64,
        },
      }
    }

    // Proses file yang diunggah
    const filesToUpload: {
      fileType: string
      fileName: string
      fileMime: string
      fileSize: number
      fileData: string
    }[] = []

    if (suratKelahiran) {
      const result = await processFile(suratKelahiran, "SURAT_KELAHIRAN")
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      if (result.data) filesToUpload.push(result.data)
    }

    if (kartuKeluarga) {
      const result = await processFile(kartuKeluarga, "KARTU_KELUARGA")
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      if (result.data) filesToUpload.push(result.data)
    }

    // Untuk setiap fileType, hapus file lama lalu insert baru (replace)
    for (const fileData of filesToUpload) {
      await db.birthRecordFile.deleteMany({
        where: {
          birthRecordId: id,
          fileType: fileData.fileType,
        },
      })

      await db.birthRecordFile.create({
        data: {
          birthRecordId: id,
          fileType: fileData.fileType,
          fileName: fileData.fileName,
          fileMime: fileData.fileMime,
          fileSize: fileData.fileSize,
          fileData: fileData.fileData,
          uploadedBy: user.id,
        },
      })
    }

    // Ambil daftar file terbaru (tanpa fileData)
    const updatedFiles = await db.birthRecordFile.findMany({
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

    // Audit log (fire-and-forget)
    createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "BirthRecord",
      entityId: id,
      details: {
        action: "UPLOAD_FILES",
        filesUploaded: filesToUpload.map((f) => ({
          fileType: f.fileType,
          fileName: f.fileName,
          fileSize: f.fileSize,
        })),
        namaBayi: record.namaBayi,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "File berhasil diunggah",
      data: updatedFiles,
    })
  } catch (error) {
    console.error("Error uploading birth record files:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}

// DELETE: Hapus file tertentu dari birth record
// Hanya ADMIN atau uploader yang bisa menghapus
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchemaSynced()

    const { id } = await params
    const user = await getCurrentUser()

    if (!user || (user.role !== "ADMIN" && user.role !== "OPERATOR")) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Ambil fileId dari query parameter
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "Parameter fileId diperlukan" }, { status: 400 })
    }

    // Cek apakah file ada
    const file = await db.birthRecordFile.findUnique({
      where: { id: fileId },
      include: {
        birthRecord: {
          select: { id: true, puskesmasId: true, namaBayi: true },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 })
    }

    // Pastikan file milik birth record yang benar
    if (file.birthRecordId !== id) {
      return NextResponse.json({ error: "File tidak terkait dengan data ini" }, { status: 400 })
    }

    // Hanya ADMIN atau uploader yang bisa hapus
    if (user.role !== "ADMIN" && file.uploadedBy !== user.id) {
      return NextResponse.json({ error: "Hanya admin atau pengunggah yang bisa menghapus file ini" }, { status: 403 })
    }

    // Hapus file
    await db.birthRecordFile.delete({
      where: { id: fileId },
    })

    // Audit log (fire-and-forget)
    createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "BirthRecord",
      entityId: id,
      details: {
        action: "DELETE_FILE",
        fileId: file.id,
        fileType: file.fileType,
        fileName: file.fileName,
        namaBayi: file.birthRecord.namaBayi,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "File berhasil dihapus",
    })
  } catch (error) {
    console.error("Error deleting birth record file:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}