// API untuk list semua file pendukung dari semua puskesmas (admin only)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const puskesmasId = searchParams.get("puskesmasId")
    const fileType = searchParams.get("fileType")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const conditions: Prisma.BirthRecordFileWhereInput[] = [
      { birthRecord: { isDeleted: false } }
    ]

    if (puskesmasId) {
      conditions.push({ birthRecord: { puskesmasId } })
    }
    if (fileType) {
      conditions.push({ fileType })
    }
    if (search) {
      conditions.push({
        OR: [
          { fileName: { contains: search, mode: "insensitive" } },
          { birthRecord: { namaBayi: { contains: search, mode: "insensitive" } } },
          { birthRecord: { nikIbu: { contains: search } } },
          { birthRecord: { namaIbu: { contains: search, mode: "insensitive" } } },
        ]
      })
    }

    const where = { AND: conditions }

    const [files, total] = await Promise.all([
      db.birthRecordFile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileType: true,
          fileName: true,
          fileMime: true,
          fileSize: true,
          createdAt: true,
          birthRecord: {
            select: {
              id: true,
              namaBayi: true,
              nikIbu: true,
              namaIbu: true,
              puskesmas: { select: { id: true, nama: true } },
            },
          },
          uploader: {
            select: { id: true, namaLengkap: true, username: true },
          },
        },
      }),
      db.birthRecordFile.count({ where }),
    ])

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error listing admin files:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Terjadi kesalahan server", details: message }, { status: 500 })
  }
}