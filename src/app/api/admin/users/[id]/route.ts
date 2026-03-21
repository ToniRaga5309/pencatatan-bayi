// API untuk update user (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  namaLengkap: z.string().min(3).max(100).optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
  puskesmasId: z.string().optional().nullable(),
  password: z.string().min(6).optional()
})

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
    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Validasi puskesmas untuk operator
    const newRole = data.role || existingUser.role
    const newPuskesmasId = data.puskesmasId !== undefined ? data.puskesmasId : existingUser.puskesmasId
    if (newRole === "OPERATOR" && !newPuskesmasId) {
      return NextResponse.json({ error: "Operator harus memiliki puskesmas" }, { status: 400 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (data.namaLengkap) updateData.namaLengkap = data.namaLengkap.toUpperCase()
    if (data.role) updateData.role = data.role
    if (data.puskesmasId !== undefined) updateData.puskesmasId = data.role === "ADMIN" ? null : data.puskesmasId
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10)

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      details: {
        username: existingUser.username,
        changes: data
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
