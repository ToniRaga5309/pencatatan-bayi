// Utility functions untuk aplikasi

/**
 * Masking NIK untuk keamanan
 * Contoh: 3201234567890123 -> 3201********0123
 */
export function maskNIK(nik: string): string {
  if (!nik || nik.length !== 16) return nik
  return nik.substring(0, 4) + "********" + nik.substring(12)
}

/**
 * Unmask NIK (kembalikan ke nilai asli)
 */
export function unmaskNIK(maskedNik: string, originalNik: string): string {
  return originalNik
}

/**
 * Validasi format NIK Indonesia
 * - Harus 16 digit
 * - Harus angka
 */
export function validateNIK(nik: string): { valid: boolean; message: string } {
  if (!nik) {
    return { valid: false, message: "NIK wajib diisi" }
  }
  
  if (!/^\d{16}$/.test(nik)) {
    return { valid: false, message: "NIK harus 16 digit angka" }
  }
  
  // Validasi kode wilayah (6 digit pertama)
  const kodeWilayah = nik.substring(0, 6)
  if (kodeWilayah.startsWith("00")) {
    return { valid: false, message: "Kode wilayah NIK tidak valid" }
  }
  
  return { valid: true, message: "" }
}

/**
 * Format tanggal ke format Indonesia
 * Contoh: 1 Januari 2024
 */
export function formatDateIndonesia(date: Date | string): string {
  const d = new Date(date)
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Format tanggal ke format ISO untuk input date
 */
export function formatDateISO(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

/**
 * Format tanggal dan waktu untuk display
 */
export function formatDateTimeIndonesia(date: Date | string): string {
  const d = new Date(date)
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const jam = d.getHours().toString().padStart(2, "0")
  const menit = d.getMinutes().toString().padStart(2, "0")
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}, ${jam}:${menit}`
}

/**
 * Mendapatkan nama bulan dalam bahasa Indonesia
 */
export function getNamaBulan(monthIndex: number): string {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return bulan[monthIndex] || ""
}

/**
 * Status badge variant
 */
export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "VERIFIED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

/**
 * Status label dalam bahasa Indonesia
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "Terverifikasi"
    case "PENDING":
      return "Menunggu"
    case "REJECTED":
      return "Ditolak"
    default:
      return status
  }
}

/**
 * Jenis kelamin label
 */
export function getJenisKelaminLabel(jk: string): string {
  return jk === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"
}

/**
 * Generate random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Truncate text dengan ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

/**
 * Get client IP address dari request headers
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  const realIp = headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return "unknown"
}
