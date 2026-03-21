// API untuk mengelola user (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  username: z.string().min(4).max(50),
  password: z.string().min(6),
  namaLengkap: z.string().min(3).max(100),
  role: z.enum(["ADMIN", "OPERATOR"]),
  puskesmasId: z.string().optional()
})

// GET: Ambil semua user
export async function GET() {
  try {
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
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// POST: Buat user baru
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createUserSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Cek apakah username sudah ada
    const existingUser = await db.user.findUnique({
      where: { username: data.username }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 })
    }

    // Validasi puskesmas untuk operator
    if (data.role === "OPERATOR" && !data.puskesmasId) {
      return NextResponse.json({ error: "Operator harus memiliki puskesmas" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Buat user
    const newUser = await db.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        namaLengkap: data.namaLengkap.toUpperCase(),
        role: data.role,
        puskesmasId: data.role === "OPERATOR" ? data.puskesmasId : null
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: newUser.id,
      details: {
        username: newUser.username,
        namaLengkap: newUser.namaLengkap,
        role: newUser.role
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "User berhasil dibuat",
      data: { ...newUser, password: undefined }
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
