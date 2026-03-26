// API untuk update dan delete user (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  namaLengkap: z.string().min(3).max(100).optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
  puskesmasNama: z.string().optional(),
  password: z.string().min(6).optional()
})

// GET: Ambil detail user
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

    const targetUser = await db.user.findUnique({
      where: { id },
      include: {
        puskesmas: { select: { id: true, nama: true } }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ ...targetUser, password: undefined })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// PUT: Update user
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

    // Cek user yang akan diedit
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = updateUserSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validasi puskesmas untuk operator
    if (data.role === "OPERATOR" && !data.puskesmasNama) {
      return NextResponse.json({ error: "Nama puskesmas wajib diisi untuk operator" }, { status: 400 })
    }

    // Hash password jika ada
    let hashedPassword: string | undefined
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10)
    }

    // Jika operator, cari atau buat puskesmas
    let puskesmasId: string | null = null
    if (data.role === "OPERATOR" && data.puskesmasNama) {
      const existingPuskesmas = await db.puskesmas.findFirst({
        where: {
          nama: {
            equals: data.puskesmasNama.toUpperCase(),
            mode: "insensitive"
          }
        }
      })

      if (existingPuskesmas) {
        puskesmasId = existingPuskesmas.id
      } else {
        const newPuskesmas = await db.puskesmas.create({
          data: {
            nama: data.puskesmasNama.toUpperCase(),
            kodeWilayah: "000000"
          }
        })
        puskesmasId = newPuskesmas.id
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        namaLengkap: data.namaLengkap?.toUpperCase(),
        role: data.role,
        puskesmasId: data.role === "OPERATOR" ? puskesmasId : null,
        ...(hashedPassword && { password: hashedPassword }),
        updatedAt: new Date()
      },
      include: {
        puskesmas: { select: { nama: true } }
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      details: {
        username: existingUser.username,
        namaLengkap: data.namaLengkap,
        role: data.role,
        puskesmas: updatedUser.puskesmas?.nama
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "User berhasil diperbarui",
      data: { ...updatedUser, password: undefined }
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// DELETE: Hapus user
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

    // Cek user yang akan dihapus
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Tidak boleh menghapus diri sendiri
    if (existingUser.id === user.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 })
    }

    // Hapus user
    await db.user.delete({
      where: { id }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "User",
      entityId: id,
      details: {
        username: existingUser.username,
        namaLengkap: existingUser.namaLengkap
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus"
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
