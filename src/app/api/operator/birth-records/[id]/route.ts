// API untuk operasi pada data kelahiran spesifik (Operator)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

// Schema validasi untuk update data
const updateBirthRecordSchema = z.object({
  nikIbu: z.string().length(16).regex(/^\d{16}$/).optional(),
  namaIbu: z.string().min(3).max(100).optional(),
  namaAyah: z.string().min(3).max(100).optional(),
  namaBayi: z.string().min(2).max(100).optional(),
  tanggalLahir: z.string().optional(),
  tempatLahir: z.string().min(2).max(100).optional(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional()
})

// GET: Ambil detail data kelahiran
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const where: Record<string, unknown> = { id, isDeleted: false }
    
    if (user.role === "OPERATOR") {
      where.puskesmasId = user.puskesmasId
    }

    const record = await db.birthRecord.findFirst({
      where,
      include: {
        puskesmas: { select: { nama: true, kodeWilayah: true } },
        creator: { select: { namaLengkap: true } }
      }
    })

    if (!record) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error fetching birth record:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// PUT: Update data kelahiran
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek data
    const existingRecord = await db.birthRecord.findFirst({
      where: { id, puskesmasId: user.puskesmasId, isDeleted: false }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    // Cek apakah data sudah pernah diunduh
    if (existingRecord.downloadedAt) {
      return NextResponse.json(
        { error: "Data yang sudah diunduh tidak dapat diedit" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validationResult = updateBirthRecordSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validasi tanggal lahir jika diubah
    if (data.tanggalLahir) {
      const date = new Date(data.tanggalLahir)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (date > today) {
        return NextResponse.json(
          { error: "Tanggal lahir tidak boleh lebih dari hari ini" },
          { status: 400 }
        )
      }
    }

    // Update data
    const updatedRecord = await db.birthRecord.update({
      where: { id },
      data: {
        ...(data.nikIbu && { nikIbu: data.nikIbu }),
        ...(data.namaIbu && { namaIbu: data.namaIbu.toUpperCase() }),
        ...(data.namaAyah && { namaAyah: data.namaAyah.toUpperCase() }),
        ...(data.namaBayi && { namaBayi: data.namaBayi.toUpperCase() }),
        ...(data.tanggalLahir && { tanggalLahir: new Date(data.tanggalLahir) }),
        ...(data.tempatLahir && { tempatLahir: data.tempatLahir.toUpperCase() }),
        ...(data.jenisKelamin && { jenisKelamin: data.jenisKelamin })
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "BirthRecord",
      entityId: id,
      details: { 
        previousData: { 
          namaBayi: existingRecord.namaBayi,
          nikIbu: existingRecord.nikIbu 
        },
        newData: data 
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "Data berhasil diperbarui",
      data: updatedRecord
    })
  } catch (error) {
    console.error("Error updating birth record:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// DELETE: Soft delete data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const existingRecord = await db.birthRecord.findFirst({
      where: { id, puskesmasId: user.puskesmasId, isDeleted: false }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    // Cek apakah data sudah pernah diunduh
    if (existingRecord.downloadedAt) {
      return NextResponse.json(
        { error: "Data yang sudah diunduh tidak dapat dihapus" },
        { status: 400 }
      )
    }

    // Soft delete
    await db.birthRecord.update({
      where: { id },
      data: { isDeleted: true }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "BirthRecord",
      entityId: id,
      details: { namaBayi: existingRecord.namaBayi },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "Data berhasil dihapus"
    })
  } catch (error) {
    console.error("Error deleting birth record:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
