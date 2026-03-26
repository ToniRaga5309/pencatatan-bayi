// API untuk CRUD data kelahiran (Operator)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { validateNIK } from "@/lib/utils-common"
import { z } from "zod"

// Schema validasi untuk input data kelahiran
const birthRecordSchema = z.object({
  nikIbu: z.string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK harus berupa angka"),
  namaIbu: z.string()
    .min(3, "Nama ibu minimal 3 karakter")
    .max(100, "Nama ibu maksimal 100 karakter"),
  namaAyah: z.string()
    .min(2, "Nama ayah minimal 2 karakter")
    .max(100, "Nama ayah maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  namaBayi: z.string()
    .min(2, "Nama bayi minimal 2 karakter")
    .max(100, "Nama bayi maksimal 100 karakter"),
  tanggalLahir: z.string()
    .refine((val) => {
      const date = new Date(val)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return date <= today
    }, "Tanggal lahir tidak boleh lebih dari hari ini"),
  tempatLahir: z.string()
    .min(2, "Tempat lahir minimal 2 karakter")
    .max(100, "Tempat lahir maksimal 100 karakter"),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"], {
    message: "Pilih jenis kelamin yang valid"
  })
})

// GET: Ambil semua data kelahiran operator
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      puskesmasId: user.puskesmasId,
      isDeleted: false
    }

    if (search) {
      where.OR = [
        { namaBayi: { contains: search } },
        { nikIbu: { contains: search } },
        { namaIbu: { contains: search } }
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
    console.error("Error fetching birth records:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}

// POST: Tambah data kelahiran baru
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validasi input
    const validationResult = birthRecordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Data tidak valid", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validasi NIK lebih detail
    const nikValidation = validateNIK(data.nikIbu)
    if (!nikValidation.valid) {
      return NextResponse.json(
        { error: nikValidation.message },
        { status: 400 }
      )
    }

    // Simpan data dengan status VERIFIED (langsung terverifikasi)
    const birthRecord = await db.birthRecord.create({
      data: {
        nikIbu: data.nikIbu,
        namaIbu: data.namaIbu.toUpperCase(),
        namaAyah: (data.namaAyah && data.namaAyah.trim()) ? data.namaAyah.toUpperCase() : "-",
        namaBayi: data.namaBayi.toUpperCase(),
        tanggalLahir: new Date(data.tanggalLahir),
        tempatLahir: data.tempatLahir.toUpperCase(),
        jenisKelamin: data.jenisKelamin,
        status: "VERIFIED",
        puskesmasId: user.puskesmasId,
        createdBy: user.id
      }
    })

    // Catat audit log
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "BirthRecord",
      entityId: birthRecord.id,
      details: {
        namaBayi: birthRecord.namaBayi,
        namaIbu: birthRecord.namaIbu
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "Data berhasil disimpan",
      data: birthRecord
    })
  } catch (error) {
    console.error("Error creating birth record:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
