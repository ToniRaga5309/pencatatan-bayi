// API untuk mensinkronkan skema database
// Menggunakan direct pg connection (bukan Prisma) untuk menjamin kerja
// bahkan ketika Prisma client bermasalah
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Gunakan direct pg connection - bukan Prisma
    const { Pool } = await import("pg")
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    })

    const results: Array<{ column: string; table: string; status: string; message: string }> = []

    try {
      // Daftar kolom yang perlu dicek/ditambahkan
      const columnsToSync = [
        { table: "birth_records", column: "is_deleted", type: "BOOLEAN NOT NULL DEFAULT false" },
        { table: "birth_records", column: "nik_bayi_updated_at", type: "TIMESTAMP(3)" },
        { table: "birth_records", column: "updated_at", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
        { table: "users", column: "updated_at", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
        { table: "puskesmas", column: "updated_at", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
        { table: "birth_records", column: "nik_bayi", type: "VARCHAR(16)" },
        { table: "birth_records", column: "berat_badan", type: "DOUBLE PRECISION" },
        { table: "birth_records", column: "panjang_badan", type: "DOUBLE PRECISION" },
        { table: "birth_records", column: "alasan_penolakan", type: "TEXT" },
        { table: "birth_records", column: "verified_by", type: "TEXT" },
        { table: "birth_records", column: "verified_at", type: "TIMESTAMP(3)" },
      ]

      for (const col of columnsToSync) {
        try {
          const checkResult = await pool.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
            [col.table, col.column]
          )

          if (checkResult.rows.length > 0) {
            results.push({
              column: col.column,
              table: col.table,
              status: "already_exists",
              message: `Kolom ${col.table}.${col.column} sudah ada`,
            })
          } else {
            await pool.query(
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

      // Update is_deleted NULL values to false
      try {
        const updateResult = await pool.query(
          `UPDATE birth_records SET is_deleted = false WHERE is_deleted IS NULL`
        )
        results.push({
          column: "is_deleted",
          table: "birth_records",
          status: "updated",
          message: `Updated NULL is_deleted values to false (${updateResult.rowCount} rows)`,
        })
      } catch {
        // Ignore if column doesn't exist yet
      }

      // Ensure audit_logs table exists
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "audit_logs" (
              "id" TEXT NOT NULL,
              "user_id" TEXT NOT NULL,
              "action" VARCHAR(20) NOT NULL,
              "entity" VARCHAR(50) NOT NULL,
              "entity_id" TEXT,
              "details" TEXT,
              "ip_address" VARCHAR(45),
              "user_agent" VARCHAR(500),
              "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
          )
        `)
        results.push({
          column: "audit_logs",
          table: "table",
          status: "verified",
          message: "Tabel audit_logs sudah ada/dibuat",
        })
      } catch (err) {
        results.push({
          column: "audit_logs",
          table: "table",
          status: "error",
          message: `Gagal membuat audit_logs: ${err instanceof Error ? err.message : String(err)}`,
        })
      }
    } finally {
      await pool.end()
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
