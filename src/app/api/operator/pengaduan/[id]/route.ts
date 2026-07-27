// API untuk detail pengaduan operator (get & delete)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureSchemaSynced } from "@/lib/schema-sync"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const { id } = await params

    const pengaduan = await db.pengaduan.findFirst({
      where: { id, userId: user.id },
    })

    if (!pengaduan) {
      return NextResponse.json({ error: "Pengaduan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: pengaduan })
  } catch (error) {
    console.error("Error fetching pengaduan detail:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    await ensureSchemaSynced()

    const { id } = await params

    // Hanya bisa hapus jika status TERBUKA dan milik user
    const pengaduan = await db.pengaduan.findFirst({
      where: { id, userId: user.id },
    })

    if (!pengaduan) {
      return NextResponse.json({ error: "Pengaduan tidak ditemukan" }, { status: 404 })
    }

    if (pengaduan.status !== "TERBUKA") {
      return NextResponse.json(
        { error: "Pengaduan yang sudah diproses tidak bisa dihapus" },
        { status: 400 }
      )
    }

    await db.pengaduan.delete({ where: { id } })

    db.auditLog
      .create({
        data: {
          userId: user.id,
          action: "DELETE",
          entity: "Pengaduan",
          entityId: id,
          details: JSON.stringify({ subjek: pengaduan.subjek }),
        },
      })
      .catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pengaduan:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}
