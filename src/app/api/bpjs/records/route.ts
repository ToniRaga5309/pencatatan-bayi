// API untuk data rekaman kelahiran BPJS (with sorting)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "BPJS") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const puskesmasId = searchParams.get("puskesmasId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit
    const sortField = searchParams.get("sortField") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Only show records that have NIK bayi
    const where: Record<string, unknown> = {
      isDeleted: false,
      nikBayi: { not: null }
    }

    if (puskesmasId && puskesmasId !== "all") {
      where.puskesmasId = puskesmasId
    }

    if (search) {
      where.OR = [
        { namaBayi: { contains: search, mode: "insensitive" } },
        { nikIbu: { contains: search, mode: "insensitive" } },
        { namaIbu: { contains: search, mode: "insensitive" } },
        { nikBayi: { contains: search, mode: "insensitive" } }
      ]
    }

    // Build orderBy
    const allowedSortFields: Record<string, string> = {
      namaBayi: "namaBayi",
      nikIbu: "nikIbu",
      namaIbu: "namaIbu",
      nikBayi: "nikBayi",
      tanggalLahir: "tanggalLahir",
      status: "status",
      createdAt: "createdAt",
      jenisKelamin: "jenisKelamin",
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
          status: true,
          createdAt: true,
          puskesmas: {
            select: { nama: true }
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
    console.error("Error fetching BPJS records:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
