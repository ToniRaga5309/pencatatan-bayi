// API untuk update user (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { ensureSchemaSynced } from "@/lib/schema-sync"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  namaLengkap: z.string().min(3).max(100).optional(),
  role: z.enum(["ADMIN", "OPERATOR", "BPJS"]).optional(),
  puskesmasId: z.string().optional().nullable(),
  puskesmasNama: z.string().optional(), // Nama puskesmas baru (manual input)
  password: z.string().min(6).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Pastikan skema database sudah sinkron sebelum operasi Prisma
    await ensureSchemaSynced()

    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
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

    // Cek user
    const existingUser = await db.user.findUnique({ 
      where: { id },
      include: { puskesmas: true }
    })
    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Tentukan role dan puskesmasId
    const newRole = data.role || existingUser.role
    
    // Handle puskesmas assignment
    let finalPuskesmasId: string | null = existingUser.puskesmasId

    if (newRole === "OPERATOR") {
      if (data.puskesmasId) {
        // Gunakan puskesmas yang sudah ada dari dropdown
        finalPuskesmasId = data.puskesmasId
      } else if (data.puskesmasNama && data.puskesmasNama.trim().length >= 3) {
        // Manual input - cek apakah sudah ada atau buat baru
        const existingPuskesmas = await db.puskesmas.findFirst({
          where: { nama: { equals: data.puskesmasNama.trim(), mode: "insensitive" } }
        })
        if (existingPuskesmas) {
          finalPuskesmasId = existingPuskesmas.id
        } else {
          const newPuskesmas = await db.puskesmas.create({
            data: {
              nama: data.puskesmasNama.trim(),
              kodeWilayah: "AUTO",
            }
          })
          finalPuskesmasId = newPuskesmas.id
        }
      } else if (!existingUser.puskesmasId) {
        return NextResponse.json({ error: "Operator harus memiliki puskesmas" }, { status: 400 })
      }
    } else {
      // Non-operator roles don't need puskesmas
      finalPuskesmasId = null
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (data.namaLengkap) updateData.namaLengkap = data.namaLengkap.toUpperCase()
    if (data.role) updateData.role = data.role
    updateData.puskesmasId = finalPuskesmasId
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10)

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        puskesmas: { select: { nama: true } }
      }
    })

    // Audit log (fire-and-forget)
    createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      details: {
        username: existingUser.username,
        changes: {
          namaLengkap: data.namaLengkap,
          role: data.role,
          puskesmas: updatedUser.puskesmas?.nama || null,
        }
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "User berhasil diperbarui",
      data: { ...updatedUser, password: undefined }
    })
  } catch (error) {
    console.error("Error updating user:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}
