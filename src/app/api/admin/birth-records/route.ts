// API untuk mengambil data kelahiran (Admin) - semua data kelahiran (with sorting)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureSchemaSynced } from "@/lib/schema-sync"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    // Pastikan skema database sudah sinkron
    await ensureSchemaSynced()

    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const puskesmasId = searchParams.get("puskesmasId") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit
    const sortField = searchParams.get("sortField") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where clause with proper Prisma types
    const where: Prisma.BirthRecordWhereInput = { 
      isDeleted: false
    }

    if (puskesmasId && puskesmasId !== "all") {
      where.puskesmasId = puskesmasId
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { namaBayi: { contains: search, mode: "insensitive" } },
        { nikIbu: { contains: search, mode: "insensitive" } },
        { namaIbu: { contains: search, mode: "insensitive" } },
        { nikBayi: { contains: search, mode: "insensitive" } }
      ]
    }

    // Build orderBy with proper Prisma types
    const allowedSortFields = ["namaBayi", "nikIbu", "namaIbu", "tanggalLahir", "status", "createdAt", "updatedAt", "jenisKelamin", "tempatLahir", "nikBayi"]
    const orderDir: Prisma.SortOrder = sortOrder === "asc" ? "asc" : "desc"
    const orderBy: Prisma.BirthRecordOrderByWithRelationInput = allowedSortFields.includes(sortField) 
      ? { [sortField]: orderDir } 
      : { createdAt: "desc" }

    const [records, total] = await Promise.all([
      db.birthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          puskesmas: { 
            select: { nama: true } 
          },
          creator: { 
            select: { namaLengkap: true } 
          }
        }
      }),
      db.birthRecord.count({ where })
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching admin birth records:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: "Terjadi kesalahan server",
      details: message
    }, { status: 500 })
  }
}
