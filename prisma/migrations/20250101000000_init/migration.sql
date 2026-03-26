-- CreateTable
CREATE TABLE "puskesmas" (
    "id" TEXT NOT NULL,
    "nama" VARCHAR(150) NOT NULL,
    "kode_wilayah" VARCHAR(10) NOT NULL,
    "alamat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puskesmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
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

-- CreateTable
CREATE TABLE "birth_records" (
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

-- CreateTable
CREATE TABLE "audit_logs" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "birth_records_puskesmas_id_idx" ON "birth_records"("puskesmas_id");

-- CreateIndex
CREATE INDEX "birth_records_status_idx" ON "birth_records"("status");

-- CreateIndex
CREATE INDEX "birth_records_tanggal_lahir_idx" ON "birth_records"("tanggal_lahir");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "birth_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
