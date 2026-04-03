import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { secret } = body
    
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔧 Memulai setup database...")

    // Check if tables exist
    const tableCheck = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `

    if (Array.isArray(tableCheck) && tableCheck.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Database tables already exist",
        next: "Run /api/seed to populate initial data"
      })
    }

    // Create tables using raw SQL
    await db.$executeRawUnsafe(`
      -- CreateTable: puskesmas
      CREATE TABLE IF NOT EXISTS "puskesmas" (
          "id" TEXT NOT NULL,
          "nama" VARCHAR(150) NOT NULL,
          "kode_wilayah" VARCHAR(10) NOT NULL,
          "alamat" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "puskesmas_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable: users
      CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "username" VARCHAR(50) NOT NULL,
          "password" VARCHAR(255) NOT NULL,
          "nama_lengkap" VARCHAR(100) NOT NULL,
          "role" VARCHAR(20) NOT NULL,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "puskesmas_id" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable: birth_records
      CREATE TABLE IF NOT EXISTS "birth_records" (
          "id" TEXT NOT NULL,
          "nik_ibu" CHAR(16) NOT NULL,
          "nama_ibu" VARCHAR(100) NOT NULL,
          "nama_ayah" VARCHAR(100) NOT NULL,
          "nama_bayi" VARCHAR(100) NOT NULL,
          "tanggal_lahir" TIMESTAMP(3) NOT NULL,
          "tempat_lahir" VARCHAR(150) NOT NULL,
          "jenis_kelamin" VARCHAR(15) NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          "alasan_penolakan" TEXT,
          "is_deleted" BOOLEAN NOT NULL DEFAULT false,
          "puskesmas_id" TEXT NOT NULL,
          "created_by" TEXT NOT NULL,
          "verified_by" TEXT,
          "verified_at" TIMESTAMP(3),
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "birth_records_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable: audit_logs
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
      );

      -- Create indexes
      CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
      CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
      CREATE INDEX IF NOT EXISTS "birth_records_puskesmas_id_idx" ON "birth_records"("puskesmas_id");
      CREATE INDEX IF NOT EXISTS "birth_records_status_idx" ON "birth_records"("status");
      CREATE INDEX IF NOT EXISTS "birth_records_tanggal_lahir_idx" ON "birth_records"("tanggal_lahir");
      CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
      CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

      -- Add foreign keys
      ALTER TABLE "users" ADD CONSTRAINT "users_puskesmas_id_fkey" 
        FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      
      ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_puskesmas_id_fkey" 
        FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_verified_by_fkey" 
        FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      
      ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entity_id_fkey" 
        FOREIGN KEY ("entity_id") REFERENCES "birth_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `)

    console.log("✅ Tables created successfully")

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully!",
      next: "Run /api/seed to populate initial data"
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({
      error: "Setup failed",
      details: String(error)
    }, { status: 500 })
  }
}
