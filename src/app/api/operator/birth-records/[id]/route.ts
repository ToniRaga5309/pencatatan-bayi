// API untuk edit data kelahiran (Operator) - hanya PENDING
// Hanya boleh mengedit: namaBayi, tempatLahir, jenisKelamin, beratBadan, panjangBadan
// Tidak boleh mengubah: nikIbu, namaIbu, namaAyah, tanggalLahir, status, puskesmasId
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

// Schema validasi untuk edit data kelahiran - hanya field yang boleh diedit
const editRecordSchema = z.object({
  namaBayi: z.string().min(3, "Nama bayi minimal 3 karakter").max(100, "Nama bayi maksimal 100 karakter"),
  tempatLahir: z.string().min(2, "Tempat lahir minimal 2 karakter").max(100, "Tempat lahir maksimal 100 karakter"),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"], { message: "Pilih jenis kelamin yang valid" }),
  beratBadan: z.number().min(0.1).max(10).optional().nullable(),
  panjangBadan: z.number().min(10).max(80).optional().nullable(),
})

// PUT: Edit data kelahiran yang masih PENDING
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    // Require ADMIN or OPERATOR role
    if (!user || (user.role !== "OPERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Operator must have puskesmasId
    if (user.role === "OPERATOR" && !user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek apakah record ada dan masih PENDING
    const existing = await db.birthRecord.findUnique({
      where: { id, isDeleted: false }
    })

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    // Operator hanya bisa edit record dari puskesmas sendiri
    if (user.role === "OPERATOR" && existing.puskesmasId !== user.puskesmasId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke data ini" }, { status: 403 })
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Hanya data dengan status Menunggu yang dapat diedit" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validationResult = editRecordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Track changes for audit log (only for editable fields)
    const changes: Record<string, { from: unknown; to: unknown }> = {}
    if (existing.namaBayi !== data.namaBayi) changes.namaBayi = { from: existing.namaBayi, to: data.namaBayi }
    if (existing.tempatLahir !== data.tempatLahir.toUpperCase()) changes.tempatLahir = { from: existing.tempatLahir, to: data.tempatLahir.toUpperCase() }
    if (existing.jenisKelamin !== data.jenisKelamin) changes.jenisKelamin = { from: existing.jenisKelamin, to: data.jenisKelamin }
    if (existing.beratBadan !== data.beratBadan) changes.beratBadan = { from: existing.beratBadan, to: data.beratBadan }
    if (existing.panjangBadan !== data.panjangBadan) changes.panjangBadan = { from: existing.panjangBadan, to: data.panjangBadan }

    // Update record - only editable fields
    const updated = await db.birthRecord.update({
      where: { id },
      data: {
        namaBayi: data.namaBayi.toUpperCase(),
        tempatLahir: data.tempatLahir.toUpperCase(),
        jenisKelamin: data.jenisKelamin,
        beratBadan: data.beratBadan,
        panjangBadan: data.panjangBadan,
      }
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "BirthRecord",
      entityId: id,
      details: {
        namaBayi: updated.namaBayi,
        fieldChanges: Object.keys(changes),
        changes,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: "Data berhasil diperbarui",
      data: updated,
    })
  } catch (error) {
    console.error("Error updating birth record:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
