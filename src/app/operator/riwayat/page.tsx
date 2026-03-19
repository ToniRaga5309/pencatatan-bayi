"use client"

// Halaman Riwayat Input Data Operator
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Loader2, Eye, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { formatDateIndonesia, getJenisKelaminLabel } from "@/lib/utils-common"

interface BirthRecord {
  id: string
  nikIbu: string
  namaIbu: string
  namaAyah: string
  namaBayi: string
  tanggalLahir: Date
  tempatLahir: string
  jenisKelamin: string
  status: string
  createdAt: Date
  puskesmas: { nama: string }
}

export default function RiwayatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<BirthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<BirthRecord | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // Redirect jika belum login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch data
  useEffect(() => {
    if (session?.user) {
      fetchRecords()
    }
  }, [session, page])

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("page", page.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/operator/birth-records?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchRecords()
  }

  const handleViewDetail = (record: BirthRecord) => {
    setSelectedRecord(record)
    setShowDetail(true)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/operator">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Riwayat Input</h1>
            <p className="text-sm text-slate-500">{session?.user?.puskesmasNama}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Kelahiran</CardTitle>
            <CardDescription>
              Lihat data kelahiran yang sudah diinput
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari nama bayi, NIK ibu, atau nama ibu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bayi</TableHead>
                    <TableHead>NIK Ibu</TableHead>
                    <TableHead>Nama Ibu</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Tidak ada data ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.namaBayi}</TableCell>
                        <TableCell className="font-mono text-sm">{record.nikIbu}</TableCell>
                        <TableCell>{record.namaIbu}</TableCell>
                        <TableCell>{formatDateIndonesia(record.tanggalLahir)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetail(record)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Data Kelahiran</DialogTitle>
            <DialogDescription>
              Informasi lengkap data kelahiran
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Nama Bayi</Label>
                  <p className="font-medium">{selectedRecord.namaBayi}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Jenis Kelamin</Label>
                  <p className="font-medium">{getJenisKelaminLabel(selectedRecord.jenisKelamin)}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Tanggal Lahir</Label>
                  <p className="font-medium">{formatDateIndonesia(selectedRecord.tanggalLahir)}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Tempat Lahir</Label>
                  <p className="font-medium">{selectedRecord.tempatLahir}</p>
                </div>
                <div>
                  <Label className="text-slate-500">NIK Ibu</Label>
                  <p className="font-medium font-mono">{selectedRecord.nikIbu}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Nama Ibu</Label>
                  <p className="font-medium">{selectedRecord.namaIbu}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Nama Ayah</Label>
                  <p className="font-medium">{selectedRecord.namaAyah}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Status</Label>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />Terverifikasi
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                Diinput pada: {formatDateIndonesia(selectedRecord.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
