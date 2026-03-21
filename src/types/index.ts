// Tipe-tipe untuk aplikasi Sistem Pencatatan Nama Bayi Baru Lahir

// Role pengguna
export type UserRole = "ADMIN" | "OPERATOR"

// Status data kelahiran
export type BirthRecordStatus = "PENDING" | "VERIFIED" | "REJECTED"

// Jenis kelamin
export type JenisKelamin = "LAKI_LAKI" | "PEREMPUAN"

// Tipe User
export interface User {
  id: string
  username: string
  namaLengkap: string
  role: UserRole
  isActive: boolean
  puskesmasId: string | null
  puskesmas?: Puskesmas
  createdAt: Date
  updatedAt: Date
}

// Tipe Puskesmas
export interface Puskesmas {
  id: string
  nama: string
  kodeWilayah: string
  alamat?: string | null
  telepon?: string | null
  createdAt: Date
  updatedAt: Date
}

// Tipe BirthRecord
export interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  tanggalLahir: Date
  tempatLahir: string
  jenisKelamin: JenisKelamin
  beratBadan?: number | null
  panjangBadan?: number | null
  status: BirthRecordStatus
  alasanPenolakan?: string | null
  isDeleted: boolean
  puskesmasId: string
  createdBy: string
  verifiedBy?: string | null
  verifiedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  puskesmas?: Puskesmas
  creator?: User
  verifier?: User | null
}

// Tipe AuditLog
export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId?: string | null
  details?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
  user?: User
}

// Tipe untuk session user (dari NextAuth)
export interface SessionUser {
  id: string
  username: string
  namaLengkap: string
  role: UserRole
  puskesmasId: string | null
  puskesmasNama: string | null
}

// Tipe untuk form input data kelahiran
export interface BirthRecordFormData {
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  tanggalLahir: string
  tempatLahir: string
  jenisKelamin: JenisKelamin
  beratBadan?: number
  panjangBadan?: number
}

// Tipe untuk response API
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Tipe untuk statistik dashboard
export interface DashboardStats {
  totalBulanIni: number
  totalPending: number
  totalVerified: number
  totalRejected: number
}
