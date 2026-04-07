// API untuk download template Excel import data kelahiran (Operator)
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      )
    }

    // Buat template Excel
    const templateData = [
      {
        "NIK Ibu": "5306014567890001",
        "Nama Ibu": "MARIA SERAN",
        "Nama Ayah": "YOHANES REBO",
        "Nama Bayi": "FRANSISKUS SERAN",
        "Tanggal Lahir": "15/01/2024",
        "Tempat Lahir": "Puskesmas Bajawa",
        "Jenis Kelamin": "L",
        "Berat Badan (kg)": 3.2,
        "Panjang Badan (cm)": 50,
      },
      {
        "NIK Ibu": "5306025678900002",
        "Nama Ibu": "THERESIA BEO",
        "Nama Ayah": "DOMINIKUS MERE",
        "Nama Bayi": "ANASTASIA BEO",
        "Tanggal Lahir": "20/02/2024",
        "Tempat Lahir": "RSUD Ngada",
        "Jenis Kelamin": "P",
        "Berat Badan (kg)": 2.8,
        "Panjang Badan (cm)": 48,
      },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)

    // Set lebar kolom
    ws["!cols"] = [
      { wch: 20 }, // NIK Ibu
      { wch: 20 }, // Nama Ibu
      { wch: 20 }, // Nama Ayah
      { wch: 20 }, // Nama Bayi
      { wch: 16 }, // Tanggal Lahir
      { wch: 22 }, // Tempat Lahir
      { wch: 14 }, // Jenis Kelamin
      { wch: 16 }, // Berat Badan
      { wch: 16 }, // Panjang Badan
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data Kelahiran")

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Return file response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template-import-kelahiran.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error downloading template:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
