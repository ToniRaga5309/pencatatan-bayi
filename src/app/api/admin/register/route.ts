// API untuk download register lengkap (semua data kelahiran)
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

    // Ambil semua data yang belum dihapus
    const records = await db.birthRecord.findMany({
      where: { isDeleted: false },
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
        status: true,
        downloadedAt: true,
        createdAt: true,
        puskesmas: { select: { nama: true } },
        creator: { select: { namaLengkap: true } }
      }
    })

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
      "Tanggal Input": new Date(record.createdAt).toLocaleDateString("id-ID"),
      "Tanggal Download": record.downloadedAt ? new Date(record.downloadedAt).toLocaleDateString("id-ID") : "-"
    }))

    // Buat workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Register Kelahiran")

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
      { wch: 15 }, // Tanggal Input
      { wch: 18 }  // Tanggal Download
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
        type: "REGISTER"
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="register-kelahiran-${new Date().toISOString().split("T")[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error("Error exporting register:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
