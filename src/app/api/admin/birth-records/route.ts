// API untuk mengambil data kelahiran (Admin) - semua data kelahiran (with sorting)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
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

    // Build where clause
    const where: Record<string, unknown> = { 
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

    // Build orderBy - only allow safe fields
    const allowedSortFields: Record<string, string> = {
      namaBayi: "namaBayi",
      nikIbu: "nikIbu",
      namaIbu: "namaIbu",
      tanggalLahir: "tanggalLahir",
      status: "status",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      jenisKelamin: "jenisKelamin",
      tempatLahir: "tempatLahir",
      nikBayi: "nikBayi",
    }

    const orderByField = allowedSortFields[sortField] || "createdAt"
    const orderBy: Record<string, string> = { [orderByField]: sortOrder === "asc" ? "asc" : "desc" }

    const [records, total] = await Promise.all([
      db.birthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          nikIbu: true,
          namaIbu: true,
          namaAyah: true,
          namaBayi: true,
          nikBayi: true,
          nikBayiUpdatedAt: true,
          tanggalLahir: true,
          tempatLahir: true,
          jenisKelamin: true,
          beratBadan: true,
          panjangBadan: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
