// API untuk mensinkronkan skema database
// Menggunakan utility ensureSchemaSynced
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { ensureSchemaSynced } from "@/lib/schema-sync"

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const success = await ensureSchemaSynced()

    return NextResponse.json({
      success,
      message: success ? "Sinkronisasi skema berhasil" : "Sinkronisasi skema gagal",
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
