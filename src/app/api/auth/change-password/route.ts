// API untuk mengubah password user
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Password lama dan baru harus diisi" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 })
    }

    // Get current user with password
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Password lama tidak benar" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Auth",
      entityId: user.id,
      details: {
        action: "CHANGE_PASSWORD",
        changedAt: new Date().toISOString()
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({ message: "Password berhasil diubah" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
