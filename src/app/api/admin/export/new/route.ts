// API untuk export data BARU yang belum pernah didownload
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"
import { format } from "date-fns"

// Format sesuai template "Format Isian Data BBLR PKM NEW.xlsx"
function createExcelFile(records: Array<{
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  tanggalLahir: Date
  tempatLahir: string
  jenisKelamin: string
  puskesmas: { nama: string }
}>, title: string, puskesmasNama: string): Buffer {
  const workbook = XLSX.utils.book_new()
  const wsData: (string | number)[][] = []

  // Baris 1: Kosong
  wsData.push([])
  // Baris 2: Judul
  wsData.push([title, "", "", "", "", "", "", "", ""])
  // Baris 3: Nama Puskesmas
  wsData.push([puskesmasNama, "", "", "", "", "", "", "", ""])
  // Baris 4: Kosong
  wsData.push([])
  // Baris 5: Header row 1
  wsData.push([
    "NO", "NAMA BAYI", "TEMPAT", "TANGGAL LAHIR", "JK", "NIK IBU", "NAMA ORANG TUA", "", "PUSKESMAS"
  ])
  // Baris 6: Header row 2
  wsData.push(["", "", "", "", "", "", "IBU", "BAPAK", ""])
  // Baris 7: Kosong
  wsData.push([])

  // Baris 8+: Data
  records.forEach((record, index) => {
    const tanggalLahir = new Date(record.tanggalLahir)
    const formattedDate = format(tanggalLahir, "dd-MM-yyyy")

    wsData.push([
      index + 1,
      record.namaBayi,
      record.tempatLahir,
      formattedDate,
      record.jenisKelamin === "LAKI_LAKI" ? "L" : "P",
      record.nikIbu,
      record.namaIbu,
      record.namaAyah,
      record.puskesmas.nama
    ])
  })

  // Buat worksheet dari data
  const worksheet = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  worksheet["!cols"] = [
    { wch: 5.5 },   // A - NO
    { wch: 27 },    // B - NAMA BAYI
    { wch: 17.5 },  // C - TEMPAT
    { wch: 25 },    // D - TANGGAL LAHIR
    { wch: 6.5 },   // E - JK
    { wch: 24 },    // F - NIK IBU
    { wch: 24 },    // G - NAMA IBU
    { wch: 23 },    // H - NAMA AYAH
    { wch: 24 }     // I - PUSKESMAS
  ]

  // Set row heights
  worksheet["!rows"] = wsData.map(() => ({ hpt: 20 }))

  // Merge cells untuk judul
  worksheet["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },  // A2:I2 - Title
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },  // A3:I3 - Puskesmas name
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },  // A5:A6 - NO
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },  // B5:B6 - NAMA BAYI
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },  // C5:C6 - TEMPAT
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },  // D5:D6 - TANGGAL LAHIR
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },  // E5:E6 - JK
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } },  // F5:F6 - NIK IBU
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },  // G5:H5 - NAMA ORANG TUA
    { s: { r: 4, c: 8 }, e: { r: 5, c: 8 } },  // I5:I6 - PUSKESMAS
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

  // Generate buffer
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
}

// GET /api/admin/export/new - Export data baru (belum pernah didownload)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const puskesmasId = searchParams.get("puskesmasId")

    // Ambil data yang sudah diverifikasi tapi BELUM pernah didownload
    const records = await db.birthRecord.findMany({
      where: {
        status: "VERIFIED",
        isDeleted: false,
        downloadedAt: null,
        ...(puskesmasId && puskesmasId !== "all" ? { puskesmasId } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        puskesmas: { select: { nama: true, kodeWilayah: true } },
        creator: { select: { namaLengkap: true } }
      }
    })

    if (records.length === 0) {
      return NextResponse.json({ 
        error: "Tidak ada data baru untuk diunduh. Semua data sudah pernah diunduh sebelumnya." 
      }, { status: 400 })
    }

    const puskesmasNama = puskesmasId && puskesmasId !== "all" && records.length > 0
      ? records[0].puskesmas.nama 
      : "SEMUA PUSKESMAS"

    const buffer = createExcelFile(records, "DATA BARU BELUM DIDOWNLOAD", puskesmasNama)

    // Tandai waktu download
    const now = new Date()
    const recordIds = records.map(r => r.id)

    // Update semua record yang di-download
    await db.birthRecord.updateMany({
      where: { id: { in: recordIds } },
      data: { downloadedAt: now }
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "EXPORT_NEW",
      entity: "BirthRecord",
      details: { totalRecords: records.length, format: "XLSX" },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="data-baru-${new Date().toISOString().split("T")[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error("Error exporting new data:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
