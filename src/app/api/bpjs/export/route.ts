// API untuk export data BPJS ke Excel
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "BPJS") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Get all records that have NIK Bayi
    const records = await db.birthRecord.findMany({
      where: {
        isDeleted: false,
        nikBayi: { not: null }
      },
      orderBy: { createdAt: "desc" },
      include: {
        puskesmas: { select: { nama: true } }
      }
    })

    // Format data for Excel
    const excelData = records.map((record, index) => ({
      "No": index + 1,
      "NIK Bayi": record.nikBayi,
      "Nama Bayi": record.namaBayi,
      "NIK Ibu": record.nikIbu,
      "Nama Ibu": record.namaIbu,
      "Nama Ayah": record.namaAyah,
      "Tanggal Lahir": new Date(record.tanggalLahir).toLocaleDateString("id-ID"),
      "Jenis Kelamin": record.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      "Puskesmas": record.puskesmas.nama,
      "Status": record.status === "VERIFIED" ? "Terverifikasi" :
               record.status === "PENDING" ? "Menunggu" : "Ditolak"
    }))

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data BPJS")

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 20 },  // NIK Bayi
      { wch: 25 },  // Nama Bayi
      { wch: 20 },  // NIK Ibu
      { wch: 25 },  // Nama Ibu
      { wch: 25 },  // Nama Ayah
      { wch: 15 },  // Tanggal Lahir
      { wch: 12 },  // Jenis Kelamin
      { wch: 30 },  // Puskesmas
      { wch: 15 },  // Status
    ]
    worksheet["!cols"] = columnWidths

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "EXPORT",
      entity: "BirthRecord",
      details: {
        totalRecords: records.length,
        format: "XLSX",
        type: "BPJS"
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="data-bpjs-nik-bayi-${new Date().toISOString().split("T")[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error("Error exporting BPJS data:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
