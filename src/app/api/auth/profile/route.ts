// API untuk profil pengguna (GET & PUT)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"

// Schema validasi untuk update nama
const updateProfileSchema = z.object({
  namaLengkap: z.string()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
})

// GET: Ambil profil user saat ini
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 401 })
    }

    // Ambil data lengkap user dari database
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        isActive: true,
        puskesmasId: true,
        createdAt: true,
        updatedAt: true,
        puskesmas: {
          select: {
            id: true,
            nama: true,
            kodeWilayah: true,
            alamat: true,
          }
        },
        _count: {
          select: {
            createdRecords: {
              where: { isDeleted: false }
            },
            verifiedRecords: true,
          }
        }
      }
    })

    if (!fullUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Ambil login terakhir dari audit log
    const lastLogin = await db.auditLog.findFirst({
      where: {
        userId: user.id,
        action: "LOGIN",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })

    return NextResponse.json({
      id: fullUser.id,
      username: fullUser.username,
      namaLengkap: fullUser.namaLengkap,
      role: fullUser.role,
      isActive: fullUser.isActive,
      puskesmasId: fullUser.puskesmasId,
      puskesmas: fullUser.puskesmas,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
      totalRecords: fullUser._count.createdRecords,
      totalVerified: fullUser._count.verifiedRecords,
      lastLogin: lastLogin?.createdAt || null,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// PUT: Update nama lengkap
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 401 })
    }

    const body = await request.json()

    // Validasi input
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      )
    }

    // Update nama lengkap
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        namaLengkap: validationResult.data.namaLengkap,
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
      }
    })

    // Catat audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      details: {
        field: "namaLengkap",
        oldValue: user.namaLengkap,
        newValue: validationResult.data.namaLengkap,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: "Nama berhasil diperbarui",
      data: updatedUser,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
