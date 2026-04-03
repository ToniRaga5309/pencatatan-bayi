// API untuk upload Excel NIK Bayi (Admin)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "Format file harus .xlsx atau .xls" }, { status: 400 })
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    if (rows.length === 0) {
      return NextResponse.json({ error: "File Excel kosong" }, { status: 400 })
    }

    let updated = 0
    let failed = 0
    const errors: Array<{ row: number; reason: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // Excel rows start at 1, header is 1

      try {
        // Find identifier field - try nikIbu, namaBayi, or id
        const nikIbu = String(row["nikIbu"] || row["nik_ibu"] || row["NIK Ibu"] || "").trim()
        const namaBayi = String(row["namaBayi"] || row["nama_bayi"] || row["Nama Bayi"] || "").trim()
        const recordId = String(row["id"] || row["ID"] || "").trim()
        const nikBayi = String(row["nikBayi"] || row["nik_bayi"] || row["NIK Bayi"] || "").trim()

        if (!nikBayi || nikBayi.length !== 16 || !/^\d{16}$/.test(nikBayi)) {
          failed++
          errors.push({ row: rowNumber, reason: `NIK Bayi tidak valid: "${nikBayi}"` })
          continue
        }

        // Find the record using one of the identifiers
        const whereClause: Record<string, unknown> = { isDeleted: false }

        if (recordId) {
          whereClause.id = recordId
        } else if (nikIbu && namaBayi) {
          whereClause.nikIbu = nikIbu
          whereClause.namaBayi = { contains: namaBayi.toUpperCase(), mode: "insensitive" }
        } else if (nikIbu) {
          whereClause.nikIbu = nikIbu
        } else if (namaBayi) {
          whereClause.namaBayi = { contains: namaBayi.toUpperCase(), mode: "insensitive" }
        } else {
          failed++
          errors.push({ row: rowNumber, reason: "Tidak ada identifier (ID, NIK Ibu, atau Nama Bayi)" })
          continue
        }

        const existingRecord = await db.birthRecord.findFirst({
          where: whereClause
        })

        if (!existingRecord) {
          failed++
          errors.push({ row: rowNumber, reason: `Data tidak ditemukan (NIK Ibu: ${nikIbu || "-"}, Nama Bayi: ${namaBayi || "-"})` })
          continue
        }

        // Update NIK bayi
        await db.birthRecord.update({
          where: { id: existingRecord.id },
          data: {
            nikBayi,
            nikBayiUpdatedAt: new Date()
          }
        })
        updated++
      } catch (error) {
        failed++
        errors.push({ row: rowNumber, reason: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
      }
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "BirthRecord",
      details: {
        action: "BATCH_UPDATE_NIK_BAYI",
        fileName: file.name,
        totalRows: rows.length,
        updated,
        failed
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json({
      success: true,
      message: `Upload selesai: ${updated} berhasil, ${failed} gagal`,
      data: {
        total: rows.length,
        updated,
        failed,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined // Limit error details
      }
    })
  } catch (error) {
    console.error("Error uploading NIK bayi:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
