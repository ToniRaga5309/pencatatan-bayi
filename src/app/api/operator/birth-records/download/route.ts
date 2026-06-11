// API untuk operator download data kelahiran miliknya sendiri (termasuk NIK bayi yang sudah diproses)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    if (!user.puskesmasId) {
      return NextResponse.json({ error: "Operator tidak terikat ke puskesmas" }, { status: 403 })
    }

    // Ambil semua data kelahiran dari puskesmas operator (yang tidak dihapus)
    const records = await db.birthRecord.findMany({
      where: {
        isDeleted: false,
        puskesmasId: user.puskesmasId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        nikIbu: true,
        namaIbu: true,
        namaAyah: true,
        namaBayi: true,
        nikBayi: true,
        tanggalLahir: true,
        tempatLahir: true,
        jenisKelamin: true,
        beratBadan: true,
        panjangBadan: true,
        status: true,
        createdAt: true,
        puskesmas: { select: { nama: true } },
      },
    })

    if (records.length === 0) {
      return NextResponse.json({ error: "Tidak ada data untuk diunduh" }, { status: 400 })
    }

    // Format data untuk Excel
    const excelData = records.map((record, index) => ({
      "No": index + 1,
      "Nama Bayi": record.namaBayi,
      "NIK Bayi": record.nikBayi || "-",
      "Jenis Kelamin": record.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      "Tanggal Lahir": new Date(record.tanggalLahir).toLocaleDateString("id-ID"),
      "Tempat Lahir": record.tempatLahir,
      "NIK Ibu": record.nikIbu,
      "Nama Ibu": record.namaIbu,
      "Nama Ayah": record.namaAyah || "-",
      "Berat Badan (kg)": record.beratBadan || "-",
      "Panjang Badan (cm)": record.panjangBadan || "-",
      "Status": record.status === "VERIFIED" ? "Terverifikasi" : record.status === "REJECTED" ? "Ditolak" : "Menunggu",
      "Puskesmas": record.puskesmas.nama,
      "Tanggal Input": new Date(record.createdAt).toLocaleDateString("id-ID"),
    }))

    // Buat workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kelahiran")

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 25 },  // Nama Bayi
      { wch: 20 },  // NIK Bayi
      { wch: 12 },  // Jenis Kelamin
      { wch: 15 },  // Tanggal Lahir
      { wch: 25 },  // Tempat Lahir
      { wch: 20 },  // NIK Ibu
      { wch: 25 },  // Nama Ibu
      { wch: 25 },  // Nama Ayah
      { wch: 14 },  // Berat Badan
      { wch: 14 },  // Panjang Badan
      { wch: 12 },  // Status
      { wch: 30 },  // Puskesmas
      { wch: 15 },  // Tanggal Input
    ]
    worksheet["!cols"] = columnWidths

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Audit log (fire-and-forget)
    createAuditLog({
      userId: user.id,
      action: "EXPORT",
      entity: "BirthRecord",
      details: {
        totalRecords: records.length,
        format: "XLSX",
        type: "OPERATOR_SELF_DOWNLOAD",
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {})

    // Return file
    const puskesmasName = records[0].puskesmas.nama.replace(/[^a-zA-Z0-9]/g, "_")
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="data-kelahiran-${puskesmasName}-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error downloading operator data:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}