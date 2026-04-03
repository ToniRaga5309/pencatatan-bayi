// API untuk edit dan hapus Puskesmas by ID (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"
import { getClientIp } from "@/lib/utils-common"

const updatePuskesmasSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  kodeWilayah: z.string().optional(),
  alamat: z.string().optional(),
  telepon: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { id } = await params

    // Check if puskesmas exists
    const existing = await db.puskesmas.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Puskesmas tidak ditemukan" }, { status: 404 })
    }

    const body = await request.json()
    const validated = updatePuskesmasSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { nama, kodeWilayah, alamat, telepon } = validated.data

    // Build update data
    const updateData: Record<string, string> = { nama }
    if (kodeWilayah !== undefined) updateData.kodeWilayah = kodeWilayah
    if (alamat !== undefined) updateData.alamat = alamat
    if (telepon !== undefined) updateData.telepon = telepon

    const updated = await db.puskesmas.update({
      where: { id },
      data: updateData
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Puskesmas",
      entityId: id,
      details: {
        nama: updated.nama,
        kodeWilayah: updated.kodeWilayah,
        alamat: updated.alamat,
        telepon: updated.telepon
      },
      ipAddress: getClientIp(request.headers)
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating puskesmas:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

// DELETE: Delete puskesmas
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { id } = await params

    // Check if puskesmas exists
    const existing = await db.puskesmas.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            birthRecords: { where: { isDeleted: false } },
            users: true,
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Puskesmas tidak ditemukan" }, { status: 404 })
    }

    // Prevent deletion if there are associated records
    if (existing._count.birthRecords > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus puskesmas "${existing.nama}" karena masih memiliki ${existing._count.birthRecords} data kelahiran` },
        { status: 400 }
      )
    }

    if (existing._count.users > 0) {
      // Unlink users from this puskesmas
      await db.user.updateMany({
        where: { puskesmasId: id },
        data: { puskesmasId: null }
      })
    }

    // Delete puskesmas
    await db.puskesmas.delete({
      where: { id }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Puskesmas",
      entityId: id,
      details: {
        nama: existing.nama,
        kodeWilayah: existing.kodeWilayah,
      },
      ipAddress: getClientIp(request.headers)
    })

    return NextResponse.json({
      success: true,
      message: `Puskesmas "${existing.nama}" berhasil dihapus`
    })
  } catch (error) {
    console.error("Error deleting puskesmas:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
