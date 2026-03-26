// API untuk CRUD data kelahiran spesifik (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

// Schema validasi untuk update
const updateBirthRecordSchema = z.object({
  namaBayi: z.string().min(2).max(100).optional(),
  tempatLahir: z.string().min(2).max(100).optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  nikIbu: z.string().length(16).regex(/^\d{16}$/).optional(),
  namaIbu: z.string().min(3).max(100).optional(),
  namaAyah: z.string().min(3).max(100).optional()
})

// GET - Ambil detail data kelahiran
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const record = await db.birthRecord.findFirst({
      where: { id, isDeleted: false },
      include: {
        puskesmas: { select: { nama: true } },
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

// PUT - Update data kelahiran (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek data
    const existingRecord = await db.birthRecord.findFirst({
      where: { id, isDeleted: false }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
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

    // Update data
    const updatedRecord = await db.birthRecord.update({
      where: { id },
      data: {
        ...(data.namaBayi && { namaBayi: data.namaBayi.toUpperCase() }),
        ...(data.tempatLahir && { tempatLahir: data.tempatLahir.toUpperCase() }),
        ...(data.tanggalLahir && { tanggalLahir: new Date(data.tanggalLahir) }),
        ...(data.jenisKelamin && { jenisKelamin: data.jenisKelamin }),
        ...(data.nikIbu && { nikIbu: data.nikIbu }),
        ...(data.namaIbu && { namaIbu: data.namaIbu.toUpperCase() }),
        ...(data.namaAyah && { namaAyah: data.namaAyah.toUpperCase() })
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

// DELETE - Soft delete data kelahiran (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek data
    const existingRecord = await db.birthRecord.findFirst({
      where: { id, isDeleted: false }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
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
