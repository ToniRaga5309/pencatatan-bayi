// API untuk CRUD puskesmas (Admin) - GET list + POST create
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

const createPuskesmasSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  kodeWilayah: z.string().min(1, "Kode wilayah wajib diisi").optional(),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
})

// GET: List all puskesmas with counts
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const puskesmasList = await db.puskesmas.findMany({
      select: {
        id: true,
        nama: true,
        kodeWilayah: true,
        alamat: true,
        telepon: true,
        _count: {
          select: {
            birthRecords: { where: { isDeleted: false } },
            users: true,
          }
        }
      },
      orderBy: { nama: "asc" }
    })

    return NextResponse.json(puskesmasList)
  } catch (error) {
    console.error("Error fetching puskesmas:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// POST: Create new puskesmas
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createPuskesmasSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if nama already exists
    const existing = await db.puskesmas.findFirst({
      where: { nama: data.nama }
    })

    if (existing) {
      return NextResponse.json(
        { error: `Puskesmas "${data.nama}" sudah terdaftar` },
        { status: 400 }
      )
    }

    const puskesmas = await db.puskesmas.create({
      data: {
        nama: data.nama,
        kodeWilayah: data.kodeWilayah || null,
        alamat: data.alamat || null,
        telepon: data.telepon || null,
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Puskesmas",
      entityId: puskesmas.id,
      details: {
        nama: puskesmas.nama,
        kodeWilayah: puskesmas.kodeWilayah,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: `Puskesmas "${data.nama}" berhasil ditambahkan`,
      data: puskesmas,
    })
  } catch (error) {
    console.error("Error creating puskesmas:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
