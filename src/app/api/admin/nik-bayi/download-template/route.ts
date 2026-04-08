// API untuk download template NIK Bayi (server-side agar file tidak rusak)
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Ambil data yang belum punya NIK Bayi sebagai referensi template
    const templateData = [
      { "nikIbu": "5306014567890001", "namaBayi": "FRANSISKUS SERAN", "nikBayi": "5306010101010001" },
      { "nikIbu": "5306025678900002", "namaBayi": "THERESIA BEO", "nikBayi": "" }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "NIK Bayi")

    // Set column widths
    const columnWidths = [
      { wch: 22 }, // NIK Ibu
      { wch: 30 }, // Nama Bayi
      { wch: 22 }, // NIK Bayi
    ]
    worksheet["!cols"] = columnWidths

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template-nik-bayi.xlsx"`
      }
    })
  } catch (error) {
    console.error("Error generating NIK template:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
