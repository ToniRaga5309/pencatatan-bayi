// API untuk manajemen NIK Bayi (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

const updateNikSchema = z.object({
  recordId: z.string().min(1),
  nikBayi: z.string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK harus berupa angka 16 digit")
})

// GET: List all birth records with NIK bayi status
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const nikStatus = searchParams.get("nikStatus") || "all" // all, with_nik, without_nik
    const puskesmasId = searchParams.get("puskesmasId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { 
      isDeleted: false 
    }

    if (puskesmasId && puskesmasId !== "all") {
      where.puskesmasId = puskesmasId
    }

    if (nikStatus === "with_nik") {
      where.nikBayi = { not: null }
    } else if (nikStatus === "without_nik") {
      where.nikBayi = null
    }

    if (search) {
      where.OR = [
        { namaBayi: { contains: search } },
        { nikIbu: { contains: search } },
        { namaIbu: { contains: search } },
        { nikBayi: { contains: search } }
      ]
    }

    const [records, total] = await Promise.all([
      db.birthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nikIbu: true,
          namaIbu: true,
          namaAyah: true,
          namaBayi: true,
          nikBayi: true,
          nikBayiUpdatedAt: true,
          tanggalLahir: true,
          tempatLahir: true,
          jenisKelamin: true,
          status: true,
          createdAt: true,
          puskesmas: {
            select: { nama: true }
          }
        }
      }),
      db.birthRecord.count({ where })
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching NIK bayi records:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// POST: Update NIK bayi for a single record
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = updateNikSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { recordId, nikBayi } = validationResult.data

    // Check record exists
    const existingRecord = await db.birthRecord.findUnique({
      where: { id: recordId }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Data kelahiran tidak ditemukan" }, { status: 404 })
    }

    // Update NIK bayi
    const updatedRecord = await db.birthRecord.update({
      where: { id: recordId },
      data: {
        nikBayi,
        nikBayiUpdatedAt: new Date()
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "BirthRecord",
      entityId: recordId,
      details: {
        action: "UPDATE_NIK_BAYI",
        namaBayi: existingRecord.namaBayi,
        oldNikBayi: existingRecord.nikBayi,
        newNikBayi: nikBayi
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "NIK Bayi berhasil diperbarui",
      data: updatedRecord
    })
  } catch (error) {
    console.error("Error updating NIK bayi:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
