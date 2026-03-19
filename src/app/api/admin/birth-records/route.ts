// API untuk mengambil data kelahiran (Admin) - hanya data baru yang belum diunduh
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit

    // Build where clause - hanya tampilkan data yang belum diunduh
    const where: Record<string, unknown> = { 
      isDeleted: false,
      downloadedAt: null  // Hanya data yang belum pernah diunduh
    }

    if (puskesmasId && puskesmasId !== "all") {
      where.puskesmasId = puskesmasId
    }

    if (search) {
      where.OR = [
        { namaBayi: { contains: search } },
        { nikIbu: { contains: search } },
        { namaIbu: { contains: search } }
      ]
    }

    const [records, total] = await Promise.all([
      db.birthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nikIbu: true,
          namaIbu: true,
          namaAyah: true,
          namaBayi: true,
          tanggalLahir: true,
          tempatLahir: true,
          jenisKelamin: true,
          status: true,
          downloadedAt: true,
          createdAt: true,
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
