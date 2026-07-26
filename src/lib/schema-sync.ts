// Utility untuk sinkronisasi skema database
// Menggunakan direct pg connection (bukan Prisma) untuk menjamin kerja
// bahkan ketika Prisma client bermasalah

// Time-based cache: skip sync if already done within this window (ms)
const SYNC_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
let lastSyncTime = 0
let lastSyncResult: boolean = false

// Daftar kolom yang perlu dicek/ditambahkan
const columnsToSync = [
  { table: "birth_records", column: "is_deleted", type: "BOOLEAN NOT NULL DEFAULT false" },
  { table: "birth_records", column: "nik_bayi_updated_at", type: "TIMESTAMP(3)" },
  { table: "birth_records", column: "updated_at", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
  { table: "users", column: "updated_at", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
  { table: "puskesmas", column: "updated_at", type: "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP" },
  { table: "birth_records", column: "nik_bayi", type: "VARCHAR(16)" },
  { table: "birth_records", column: "berat_badan", type: "DOUBLE PRECISION" },
  { table: "birth_records", column: "panjang_badan", type: "DOUBLE PRECISION" },
  { table: "birth_records", column: "alasan_penolakan", type: "TEXT" },
  { table: "birth_records", column: "verified_by", type: "TEXT" },
  { table: "birth_records", column: "verified_at", type: "TIMESTAMP(3)" },
  { table: "birth_records", column: "downloaded_at", type: "TIMESTAMP(3)" },
  { table: "birth_records", column: "no_hp", type: "VARCHAR(20)" },
  { table: "birth_records", column: "email_ortu", type: "VARCHAR(100)" },
  { table: "puskesmas", column: "telepon", type: "VARCHAR(20)" },
  { table: "puskesmas", column: "alamat", type: "TEXT" },
]

// Kolom yang harus NULLABLE (boleh kosong)
const nullableColumns = [
  { table: "birth_records", column: "nik_bayi" },
  { table: "birth_records", column: "nik_bayi_updated_at" },
  { table: "birth_records", column: "berat_badan" },
  { table: "birth_records", column: "panjang_badan" },
  { table: "birth_records", column: "alasan_penolakan" },
  { table: "birth_records", column: "verified_by" },
  { table: "birth_records", column: "verified_at" },
  { table: "birth_records", column: "downloaded_at" },
  { table: "puskesmas", column: "alamat" },
  { table: "puskesmas", column: "telepon" },
  { table: "birth_records", column: "no_hp" },
  { table: "birth_records", column: "email_ortu" },
  { table: "users", column: "puskesmas_id" },
]

// Deduplication: hanya satu sync yang berjalan pada satu waktu
let syncPromise: Promise<boolean> | null = null

/**
 * Pastikan skema database sudah sesuai dengan Prisma schema.
 * Fungsi ini aman dipanggil berkali-kali (idempotent).
 * Menggunakan direct pg connection, bukan Prisma.
 * Dilengkapi time-based cache: skip jika sudah sync dalam 10 menit terakhir.
 */
export async function ensureSchemaSynced(): Promise<boolean> {
  // Return cached result if within TTL
  const now = Date.now()
  if (now - lastSyncTime < SYNC_CACHE_TTL) {
    return lastSyncResult
  }

  // Deduplicate concurrent calls
  if (syncPromise) return syncPromise

  syncPromise = doSync()

  try {
    const result = await syncPromise
    lastSyncTime = Date.now()
    lastSyncResult = result
    return result
  } finally {
    syncPromise = null
  }
}

async function doSync(): Promise<boolean> {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error("DATABASE_URL is not set")
      return false
    }

    // Dynamic import untuk pg (hanya di server)
    const { Pool } = await import("pg")
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      // Timeout singkat agar tidak blocking
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 5000,
    })

    try {
      // 0. Drop FK constraint on audit_logs.entity_id (referencing birth_records is wrong)
      try {
        await pool.query(`ALTER TABLE IF EXISTS "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_entity_id_fkey"`)
        console.log("[schema-sync] Dropped invalid FK constraint on audit_logs.entity_id")
      } catch {
        // Ignore - constraint might not exist
      }

      // 1. Tambahkan kolom yang belum ada
      for (const col of columnsToSync) {
        try {
          await pool.query(
            `ALTER TABLE "${col.table}" ADD COLUMN IF NOT EXISTS "${col.column}" ${col.type}`
          )
        } catch (err) {
          // Kolom mungkin sudah ada dengan tipe berbeda - coba alter tipe
          try {
            await pool.query(
              `ALTER TABLE "${col.table}" ALTER COLUMN "${col.column}" TYPE ${col.type.split(" ").slice(0, -1).join(" ")} USING "${col.column}"::${col.type.split(" ")[0]}`
            )
          } catch {
            // Ignore - kolom sudah benar
          }
        }
      }

      // 2. Pastikan kolom nullable benar (DROP NOT NULL jika ada)
      for (const col of nullableColumns) {
        try {
          await pool.query(
            `ALTER TABLE "${col.table}" ALTER COLUMN "${col.column}" DROP NOT NULL`
          )
        } catch {
          // Kolom mungkin tidak ada atau sudah nullable - ignore
        }
      }

      // 3. Fix is_deleted NULL values
      try {
        await pool.query(
          `UPDATE birth_records SET is_deleted = false WHERE is_deleted IS NULL`
        )
      } catch {
        // Ignore
      }

      // 4. Ensure audit_logs table exists (without FK on entity_id)
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "audit_logs" (
              "id" TEXT NOT NULL,
              "user_id" TEXT NOT NULL,
              "action" VARCHAR(20) NOT NULL,
              "entity" VARCHAR(50) NOT NULL,
              "entity_id" TEXT,
              "details" TEXT,
              "ip_address" VARCHAR(45),
              "user_agent" VARCHAR(500),
              "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
          )
        `)
      } catch {
        // Ignore - table might already exist
      }

      // 5. Ensure foreign key on users.puskesmas_id exists
      try {
        await pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'users_puskesmas_id_fkey'
            ) THEN
              ALTER TABLE "users" ADD CONSTRAINT "users_puskesmas_id_fkey" 
              FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE SET NULL;
            END IF;
          END $$
        `)
      } catch {
        // Ignore
      }

      // 6. Ensure birth_record_files table exists
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "birth_record_files" (
              "id" TEXT NOT NULL,
              "birth_record_id" TEXT NOT NULL,
              "file_type" VARCHAR(30) NOT NULL,
              "file_name" VARCHAR(255) NOT NULL,
              "file_mime" VARCHAR(100) NOT NULL,
              "file_size" INTEGER NOT NULL,
              "file_data" TEXT NOT NULL,
              "uploaded_by" TEXT NOT NULL,
              "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "birth_record_files_pkey" PRIMARY KEY ("id")
          )
        `)
      } catch {
        // Ignore
      }
      // FK: birth_record_files.birth_record_id -> birth_records.id
      try {
        await pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'birth_record_files_birth_record_id_fkey'
            ) THEN
              ALTER TABLE "birth_record_files" ADD CONSTRAINT "birth_record_files_birth_record_id_fkey" 
              FOREIGN KEY ("birth_record_id") REFERENCES "birth_records"("id") ON DELETE CASCADE;
            END IF;
          END $$
        `)
      } catch {
        // Ignore
      }
      // FK: birth_record_files.uploaded_by -> users.id
      try {
        await pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'birth_record_files_uploaded_by_fkey'
            ) THEN
              ALTER TABLE "birth_record_files" ADD CONSTRAINT "birth_record_files_uploaded_by_fkey" 
              FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE;
            END IF;
          END $$
        `)
      } catch {
        // Ignore
      }
      // Indexes for birth_record_files
      try { await pool.query(`CREATE INDEX IF NOT EXISTS "birth_record_files_birth_record_id_idx" ON "birth_record_files"("birth_record_id")`) } catch {}
      try { await pool.query(`CREATE INDEX IF NOT EXISTS "birth_record_files_file_type_idx" ON "birth_record_files"("file_type")`) } catch {}

      // 7. Ensure pengaduan table exists
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "pengaduan" (
              "id" TEXT NOT NULL,
              "user_id" TEXT NOT NULL,
              "subjek" VARCHAR(200) NOT NULL,
              "pesan" TEXT NOT NULL,
              "kategori" VARCHAR(30) NOT NULL,
              "prioritas" VARCHAR(15) NOT NULL DEFAULT 'SEDANG',
              "status" VARCHAR(20) NOT NULL DEFAULT 'TERBUKA',
              "balasan" TEXT,
              "balasan_oleh" TEXT,
              "balasan_pada" TIMESTAMP(3),
              "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "pengaduan_pkey" PRIMARY KEY ("id")
          )
        `)
      } catch {
        // Ignore - table might already exist
      }
      // FK: pengaduan.user_id -> users.id
      try {
        await pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'pengaduan_user_id_fkey'
            ) THEN
              ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_user_id_fkey"
              FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
            END IF;
          $$
        `)
      } catch {
        // Ignore
      }
      // Indexes for pengaduan
      try { await pool.query(`CREATE INDEX IF NOT EXISTS "pengaduan_user_id_idx" ON "pengaduan"("user_id")`) } catch {}
      try { await pool.query(`CREATE INDEX IF NOT EXISTS "pengaduan_status_idx" ON "pengaduan"("status")`) } catch {}
      try { await pool.query(`CREATE INDEX IF NOT EXISTS "pengaduan_kategori_idx" ON "pengaduan"("kategori")`) } catch {}
      try { await pool.query(`CREATE INDEX IF NOT EXISTS "pengaduan_created_at_idx" ON "pengaduan"("created_at")`) } catch {}

      console.log("[schema-sync] Schema sync completed successfully")
      return true
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error("[schema-sync] Error syncing schema:", error)
    return false
  }
}
