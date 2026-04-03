// API untuk import data kelahiran dari Excel (Operator)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { z } from "zod"
import * as XLSX from "xlsx"

// Schema validasi untuk setiap baris Excel
const importRowSchema = z.object({
  nikIbu: z.string()
    .length(16, "NIK Ibu harus 16 digit")
    .regex(/^\d{16}$/, "NIK Ibu harus berupa angka"),
  namaIbu: z.string()
    .min(3, "Nama Ibu minimal 3 karakter")
    .max(100, "Nama Ibu maksimal 100 karakter"),
  namaAyah: z.string()
    .min(3, "Nama Ayah minimal 3 karakter")
    .max(100, "Nama Ayah maksimal 100 karakter"),
  namaBayi: z.string()
    .min(3, "Nama Bayi minimal 3 karakter")
    .max(100, "Nama Bayi maksimal 100 karakter"),
  tanggalLahir: z.string()
    .min(1, "Tanggal Lahir wajib diisi"),
  tempatLahir: z.string()
    .min(2, "Tempat Lahir minimal 2 karakter")
    .max(100, "Tempat Lahir maksimal 100 karakter"),
  jenisKelamin: z.string()
    .min(1, "Jenis Kelamin wajib diisi"),
  beratBadan: z.any().optional(),
  panjangBadan: z.any().optional(),
})

// Fungsi untuk parsing tanggal DD/MM/YYYY
function parseTanggalLahir(value: string): Date | null {
  // Coba format DD/MM/YYYY
  const dmyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1])
    const month = parseInt(dmyMatch[2]) - 1
    const year = parseInt(dmyMatch[3])
    const date = new Date(year, month, day)
    if (!isNaN(date.getTime())) return date
  }

  // Coba format YYYY-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) return date
  }

  // Coba parsing langsung
  const date = new Date(value)
  if (!isNaN(date.getTime())) return date

  return null
}

// Fungsi untuk normalisasi jenis kelamin
function normalizeJenisKelamin(value: string): "LAKI_LAKI" | "PEREMPUAN" | null {
  const upper = value.toString().toUpperCase().trim()
  if (upper === "L" || upper === "LAKI-LAKI" || upper === "LAKI_LAKI" || upper === "MALE" || upper === "M") {
    return "LAKI_LAKI"
  }
  if (upper === "P" || upper === "PEREMPUAN" || upper === "FEMALE" || upper === "F") {
    return "PEREMPUAN"
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "OPERATOR" || !user.puskesmasId) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      )
    }

    // Validasi tipe file
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ]
    const validExtensions = [".xlsx", ".xls"]
    const fileName = file.name.toLowerCase()
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext))

    if (!validTypes.includes(file.type) && !hasValidExt) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan file .xlsx atau .xls" },
        { status: 400 }
      )
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      )
    }

    // Baca file Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" })

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "File Excel kosong" },
        { status: 400 }
      )
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    // Proses setiap baris
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 karena baris 1 header, mulai baris ke-2

      try {
        // Mapping kolom Excel (fleksibel dengan berbagai nama kolom)
        const rawData = {
          nikIbu: String(row["NIK Ibu"] || row["nikIbu"] || row["NIK_IBU"] || row["nik_ibu"] || "").trim(),
          namaIbu: String(row["Nama Ibu"] || row["namaIbu"] || row["NAMA_IBU"] || row["nama_ibu"] || "").trim(),
          namaAyah: String(row["Nama Ayah"] || row["namaAyah"] || row["NAMA_AYAH"] || row["nama_ayah"] || "").trim(),
          namaBayi: String(row["Nama Bayi"] || row["namaBayi"] || row["NAMA_BAYI"] || row["nama_bayi"] || "").trim(),
          tanggalLahir: String(row["Tanggal Lahir"] || row["tanggalLahir"] || row["TANGGAL_LAHIR"] || row["tanggal_lahir"] || "").trim(),
          tempatLahir: String(row["Tempat Lahir"] || row["tempatLahir"] || row["TEMPAT_LAHIR"] || row["tempat_lahir"] || "").trim(),
          jenisKelamin: String(row["Jenis Kelamin"] || row["jenisKelamin"] || row["JENIS_KELAMIN"] || row["jenis_kelamin"] || "").trim(),
          beratBadan: row["Berat Badan (kg)"] || row["Berat Badan"] || row["beratBadan"] || row["berat_badan"] || "",
          panjangBadan: row["Panjang Badan (cm)"] || row["Panjang Badan"] || row["panjangBadan"] || row["panjang_badan"] || "",
        }

        // Skip baris kosong
        if (!rawData.nikIbu && !rawData.namaBayi) {
          continue
        }

        // Validasi dengan Zod
        const result = importRowSchema.safeParse(rawData)
        if (!result.success) {
          const firstError = result.error.issues[0]
          errors.push(`Baris ${rowNum}: ${firstError?.message || "Data tidak valid"}`)
          failed++
          continue
        }

        // Parse tanggal lahir
        const tanggalLahir = parseTanggalLahir(rawData.tanggalLahir)
        if (!tanggalLahir) {
          errors.push(`Baris ${rowNum}: Format tanggal "${rawData.tanggalLahir}" tidak valid. Gunakan DD/MM/YYYY`)
          failed++
          continue
        }

        // Validasi tanggal tidak di masa depan
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        if (tanggalLahir > today) {
          errors.push(`Baris ${rowNum}: Tanggal lahir tidak boleh lebih dari hari ini`)
          failed++
          continue
        }

        // Normalisasi jenis kelamin
        const jk = normalizeJenisKelamin(rawData.jenisKelamin)
        if (!jk) {
          errors.push(`Baris ${rowNum}: Jenis kelamin "${rawData.jenisKelamin}" tidak valid. Gunakan L/P`)
          failed++
          continue
        }

        // Parse berat badan (opsional)
        let beratBadan: number | undefined = undefined
        if (rawData.beratBadan) {
          const bb = parseFloat(String(rawData.beratBadan))
          if (!isNaN(bb) && bb > 0 && bb < 10) {
            beratBadan = bb
          }
        }

        // Parse panjang badan (opsional)
        let panjangBadan: number | undefined = undefined
        if (rawData.panjangBadan) {
          const pb = parseFloat(String(rawData.panjangBadan))
          if (!isNaN(pb) && pb > 0 && pb < 100) {
            panjangBadan = pb
          }
        }

        // Simpan ke database
        await db.birthRecord.create({
          data: {
            nikIbu: rawData.nikIbu,
            namaIbu: rawData.namaIbu.toUpperCase(),
            namaAyah: rawData.namaAyah.toUpperCase(),
            namaBayi: rawData.namaBayi.toUpperCase(),
            tanggalLahir,
            tempatLahir: rawData.tempatLahir.toUpperCase(),
            jenisKelamin: jk,
            beratBadan,
            panjangBadan,
            status: "PENDING",
            puskesmasId: user.puskesmasId,
            createdBy: user.id,
          }
        })

        success++
      } catch (err) {
        errors.push(`Baris ${rowNum}: ${err instanceof Error ? err.message : "Error tidak diketahui"}`)
        failed++
      }
    }

    // Catat audit log
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "BirthRecord",
      details: {
        importResult: `${success} berhasil, ${failed} gagal`,
        fileName: file.name,
        totalRows: rows.length,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${success} berhasil, ${failed} gagal`,
      data: {
        total: rows.length,
        success,
        failed,
        errors
      }
    })
  } catch (error) {
    console.error("Error importing birth records:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
