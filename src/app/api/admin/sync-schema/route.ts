// API untuk mensinkronkan skema database dengan Prisma schema
// Menambahkan kolom yang mungkin belum ada di database production (dari versi sebelumnya)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Opsi 1: Auth via session (admin user)
    const user = await getCurrentUser()

    // Opsi 2: Auth via secret (untuk debugging/direct call)
    let authorized = user?.role === "ADMIN"

    if (!authorized) {
      const body = await request.json().catch(() => ({}))
      const { secret } = body
      if (secret && secret === process.env.NEXTAUTH_SECRET) {
        authorized = true
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Gunakan dynamic import untuk akses raw query
    const { db } = await import("@/lib/db")

    const results: Array<{ column: string; table: string; status: string; message: string }> = []

    // Daftar kolom yang perlu dicek/ditambahkan
    const columnsToSync = [
      {
        table: "birth_records",
        column: "is_deleted",
        type: "BOOLEAN NOT NULL DEFAULT false",
      },
      {
        table: "birth_records",
        column: "nik_bayi_updated_at",
        type: "TIMESTAMP(3)",
      },
      {
        table: "birth_records",
        column: "updated_at",
        type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP",
      },
      {
        table: "users",
        column: "updated_at",
        type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP",
      },
      {
        table: "puskesmas",
        column: "updated_at",
        type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP",
      },
    ]

    for (const col of columnsToSync) {
      try {
        // Cek apakah kolom sudah ada
        const check = await db.$queryRawUnsafe(`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = '${col.table}'
          AND column_name = '${col.column}'
        `)

        if (Array.isArray(check) && check.length > 0) {
          results.push({
            column: col.column,
            table: col.table,
            status: "already_exists",
            message: `Kolom ${col.table}.${col.column} sudah ada`,
          })
        } else {
          // Tambahkan kolom yang belum ada
          await db.$executeRawUnsafe(
            `ALTER TABLE "${col.table}" ADD COLUMN IF NOT EXISTS "${col.column}" ${col.type}`
          )
          results.push({
            column: col.column,
            table: col.table,
            status: "added",
            message: `Kolom ${col.table}.${col.column} berhasil ditambahkan`,
          })
        }
      } catch (err) {
        results.push({
          column: col.column,
          table: col.table,
          status: "error",
          message: `Gagal: ${err instanceof Error ? err.message : String(err)}`,
        })
      }
    }

    // Update kolom is_deleted untuk data yang sudah ada (set ke false jika NULL)
    try {
      const updateResult = await db.$executeRawUnsafe(`
        UPDATE birth_records SET is_deleted = false WHERE is_deleted IS NULL
      `)
      results.push({
        column: "is_deleted",
        table: "birth_records",
        status: "updated",
        message: `Updated NULL is_deleted values to false (${updateResult} rows)`,
      })
    } catch {
      // Ignore if not needed
    }

    const addedCount = results.filter(r => r.status === "added").length
    const errorCount = results.filter(r => r.status === "error").length

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${addedCount} kolom ditambahkan, ${errorCount} error`,
      results,
    })
  } catch (error) {
    console.error("Schema sync error:", error)
    return NextResponse.json({
      success: false,
      error: "Gagal sinkronisasi skema",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
