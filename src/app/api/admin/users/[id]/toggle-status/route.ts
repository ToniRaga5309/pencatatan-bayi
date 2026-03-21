// API untuk toggle status aktif user (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Cek user
    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Jangan biarkan admin menonaktifkan dirinya sendiri
    if (existingUser.id === user.id) {
      return NextResponse.json({ error: "Tidak dapat mengubah status akun sendiri" }, { status: 400 })
    }

    // Toggle status
    const updatedUser = await db.user.update({
      where: { id },
      data: { isActive: !existingUser.isActive }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: existingUser.isActive ? "DELETE" : "UPDATE",
      entity: "User",
      entityId: id,
      details: {
        username: existingUser.username,
        newStatus: updatedUser.isActive ? "AKTIF" : "NONAKTIF"
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: `User berhasil ${updatedUser.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: { ...updatedUser, password: undefined }
    })
  } catch (error) {
    console.error("Error toggling user status:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
