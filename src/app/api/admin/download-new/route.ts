// API untuk download data baru (belum pernah diunduh)
// Dan update status downloadedAt
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    // Ambil data yang belum pernah diunduh
    const records = await db.birthRecord.findMany({
      where: { 
        isDeleted: false,
        downloadedAt: null
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nikIbu: true,
        namaIbu: true,
        namaAyah: true,
        namaBayi: true,
        tanggalLahir: true,
        tempatLahir: true,
        jenisKelamin: true,
        createdAt: true,
        puskesmas: { select: { nama: true } },
        creator: { select: { namaLengkap: true } }
      }
    })

    if (records.length === 0) {
      return NextResponse.json({ error: "Tidak ada data baru untuk diunduh" }, { status: 400 })
    }

    // Format data untuk Excel sesuai template
    const excelData = records.map((record, index) => ({
      "No": index + 1,
      "Nama Bayi": record.namaBayi,
      "Jenis Kelamin": record.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      "Tanggal Lahir": new Date(record.tanggalLahir).toLocaleDateString("id-ID"),
      "Tempat Lahir": record.tempatLahir,
      "NIK Ibu": record.nikIbu,
      "Nama Ibu": record.namaIbu,
      "Nama Ayah": record.namaAyah,
      "Puskesmas": record.puskesmas.nama,
      "Diinput Oleh": record.creator.namaLengkap,
      "Tanggal Input": new Date(record.createdAt).toLocaleDateString("id-ID")
    }))

    // Buat workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Baru Kelahiran")

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // No
      { wch: 25 }, // Nama Bayi
      { wch: 12 }, // Jenis Kelamin
      { wch: 15 }, // Tanggal Lahir
      { wch: 25 }, // Tempat Lahir
      { wch: 20 }, // NIK Ibu
      { wch: 25 }, // Nama Ibu
      { wch: 25 }, // Nama Ayah
      { wch: 30 }, // Puskesmas
      { wch: 25 }, // Diinput Oleh
      { wch: 15 }  // Tanggal Input
    ]
    worksheet["!cols"] = columnWidths

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Update downloadedAt untuk semua record yang diunduh
    const now = new Date()
    await db.birthRecord.updateMany({
      where: {
        id: { in: records.map(r => r.id) }
      },
      data: {
        downloadedAt: now
      }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "EXPORT",
      entity: "BirthRecord",
      details: {
        totalRecords: records.length,
        format: "XLSX",
        type: "NEW_DATA"
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="data-baru-kelahiran-${new Date().toISOString().split("T")[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error("Error downloading new data:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
