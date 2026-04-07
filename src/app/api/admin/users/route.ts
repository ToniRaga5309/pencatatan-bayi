// API untuk mengelola user (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { ensureSchemaSynced } from "@/lib/schema-sync"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  username: z.string().min(4).max(50),
  password: z.string().min(6),
  namaLengkap: z.string().min(3).max(100),
  role: z.enum(["ADMIN", "OPERATOR", "BPJS"]),
  // Operator bisa memilih puskesmas yang sudah ada ATAU memasukkan nama baru
  puskesmasId: z.string().optional(),
  puskesmasNama: z.string().optional(), // Nama puskesmas baru (jika tidak ada di dropdown)
})

// GET: Ambil semua user
export async function GET() {
  try {
    // Pastikan skema database sudah sinkron sebelum query Prisma
    await ensureSchemaSynced()

    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const users = await db.user.findMany({
      include: {
        puskesmas: { select: { nama: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[GET /api/admin/users] Error:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server"
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}

// POST: Buat user baru
export async function POST(request: NextRequest) {
  try {
    // Pastikan skema database sudah sinkron sebelum operasi Prisma
    const synced = await ensureSchemaSynced()
    if (!synced) {
      console.warn("[POST /api/admin/users] Schema sync skipped or failed, continuing with Prisma...")
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[POST /api/admin/users] Request body:", JSON.stringify({ ...body, password: "***" }))

    // Validate input with Zod
    let validationResult
    try {
      validationResult = createUserSchema.safeParse(body)
    } catch (err) {
      console.error("[POST /api/admin/users] Validation error:", err)
      return NextResponse.json({ error: "Format data tidak valid" }, { status: 400 })
    }
    
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors
      console.warn("[POST /api/admin/users] Validation failed:", JSON.stringify(fieldErrors))
      return NextResponse.json(
        { error: "Data tidak valid", details: fieldErrors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Cek apakah username sudah ada
    let existingUser
    try {
      existingUser = await db.user.findUnique({
        where: { username: data.username }
      })
    } catch (err) {
      console.error("[POST /api/admin/users] Error checking existing user:", err)
      return NextResponse.json({ error: "Gagal memeriksa username. Coba lagi." }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 })
    }

    // Tentukan puskesmasId untuk operator
    let puskesmasId: string | null = null

    if (data.role === "OPERATOR") {
      if (data.puskesmasId) {
        // Gunakan puskesmas yang sudah ada
        puskesmasId = data.puskesmasId
      } else if (data.puskesmasNama && data.puskesmasNama.trim().length >= 3) {
        // Cek apakah puskesmas dengan nama ini sudah ada
        try {
          const existingPuskesmas = await db.puskesmas.findFirst({
            where: { nama: { equals: data.puskesmasNama.trim(), mode: "insensitive" } }
          })

          if (existingPuskesmas) {
            puskesmasId = existingPuskesmas.id
          } else {
            // Buat puskesmas baru
            const newPuskesmas = await db.puskesmas.create({
              data: {
                nama: data.puskesmasNama.trim(),
                kodeWilayah: "AUTO",
              }
            })
            puskesmasId = newPuskesmas.id
            console.log("[POST /api/admin/users] Created new puskesmas:", newPuskesmas.id, newPuskesmas.nama)
          }
        } catch (err) {
          console.error("[POST /api/admin/users] Error finding/creating puskesmas:", err)
          return NextResponse.json({ error: "Gagal memproses puskesmas. Coba lagi." }, { status: 500 })
        }
      }

      if (!puskesmasId) {
        return NextResponse.json({ error: "Operator harus memiliki puskesmas. Pilih dari daftar atau masukkan nama baru." }, { status: 400 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Buat user
    let newUser
    try {
      newUser = await db.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          namaLengkap: data.namaLengkap.toUpperCase(),
          role: data.role,
          puskesmasId
        },
        include: {
          puskesmas: { select: { nama: true } }
        }
      })
      console.log("[POST /api/admin/users] User created successfully:", newUser.id, newUser.username)
    } catch (err) {
      console.error("[POST /api/admin/users] Error creating user:", err)
      return NextResponse.json({ error: "Gagal membuat user. Coba lagi." }, { status: 500 })
    }

    // Audit log (fire-and-forget, jangan blocking response)
    createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "User",
      entityId: newUser.id,
      details: {
        username: newUser.username,
        namaLengkap: newUser.namaLengkap,
        role: newUser.role,
        puskesmas: newUser.puskesmas?.nama || null,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "User berhasil dibuat",
      data: { ...newUser, password: undefined }
    })
  } catch (error) {
    console.error("[POST /api/admin/users] Unhandled error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: message },
      { status: 500 }
    )
  }
}
