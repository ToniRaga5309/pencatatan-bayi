"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Loader2, Download, FileText, Paperclip, Menu, UserCircle, Settings, ChevronLeft, ChevronRight, Building, Filter } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { toast } from "sonner"

interface FileItem {
  id: string
  fileType: string
  fileName: string
  fileMime: string
  fileSize: number
  createdAt: string
  birthRecord: {
    id: string
    namaBayi: string
    nikIbu: string
    namaIbu: string
    puskesmas: { id: string; nama: string }
  }
  uploader: { id: string; namaLengkap: string; username: string }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function getFileTypeLabel(type: string) {
  return type === "SURAT_KELAHIRAN" ? "Surat Keterangan Lahir" : "Kartu Keluarga"
}

function getFileTypeBadge(type: string) {
  if (type === "SURAT_KELAHIRAN") {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Surat Lahir</Badge>
  }
  return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Kartu Keluarga</Badge>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function DokumenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <DokumenPageContent />
    </Suspense>
  )
}

function DokumenPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [fileTypeFilter, setFileTypeFilter] = useState("")
  const [puskesmasFilter, setPuskesmasFilter] = useState("")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") fetchFiles()
  }, [session, page, fileTypeFilter, puskesmasFilter])

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (fileTypeFilter) params.append("fileType", fileTypeFilter)
      if (puskesmasFilter) params.append("puskesmasId", puskesmasFilter)
      params.append("page", page.toString())
      params.append("limit", "20")

      const res = await fetch(`/api/admin/files?${params}`)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch {
      console.error("Error fetching files")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchFiles()
  }

  const handleDownload = (recordId: string, fileId: string) => {
    window.open(`/api/admin/birth-records/${recordId}/files/${fileId}/download`, "_blank")
  }

  // Get unique puskesmas from loaded files for filter
  const puskesmasList = Array.from(
    new Map(files.map((f) => [f.birthRecord.puskesmas.id, f.birthRecord.puskesmas.nama])).entries()
  )

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dokumen Pendukung</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {total > 0 ? `${total} dokumen dari operator puskesmas` : "Belum ada dokumen"}
              </p>
            </div>
          </div>
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu Admin</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/dokumen"><Paperclip className="w-4 h-4 mr-2 text-blue-600" />Dokumen Pendukung</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/profile"><UserCircle className="w-4 h-4 mr-2" />Profil Saya</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <ThemeToggle />
        </div>
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Dokumen Pendukung Operator
            </CardTitle>
            <CardDescription>
              Kelola dan unduh dokumen surat keterangan lahir & kartu keluarga yang diupload oleh operator puskesmas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari nama bayi, NIK ibu, atau nama file..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="max-w-sm"
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={fileTypeFilter} onValueChange={(v) => { setFileTypeFilter(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-44">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Tipe File" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="SURAT_KELAHIRAN">Surat Lahir</SelectItem>
                    <SelectItem value="KARTU_KELUARGA">Kartu Keluarga</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={puskesmasFilter} onValueChange={(v) => { setPuskesmasFilter(v === "all" ? "" : v); setPage(1) }}>
                  <SelectTrigger className="w-48">
                    <Building className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Puskesmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Puskesmas</SelectItem>
                    {puskesmasList.map(([id, nama]) => (
                      <SelectItem key={id} value={id}>{nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="w-10">No</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Nama File</TableHead>
                    <TableHead className="hidden sm:table-cell">Nama Bayi</TableHead>
                    <TableHead className="hidden md:table-cell">NIK Ibu</TableHead>
                    <TableHead className="hidden lg:table-cell">Puskesmas</TableHead>
                    <TableHead className="hidden lg:table-cell">Diupload Oleh</TableHead>
                    <TableHead className="hidden xl:table-cell">Tanggal Upload</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Paperclip className="w-12 h-12 opacity-30" />
                          <p className="font-medium">Belum ada dokumen pendukung</p>
                          <p className="text-sm">Dokumen akan muncul setelah operator puskesmas mengupload file</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file, index) => (
                      <TableRow key={file.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell className="text-slate-400 text-sm">{(page - 1) * 20 + index + 1}</TableCell>
                        <TableCell>{getFileTypeBadge(file.fileType)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]" title={file.fileName}>{file.fileName}</p>
                              <p className="text-xs text-slate-400">{formatFileSize(file.fileSize)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-medium text-sm">{file.birthRecord.namaBayi}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-sm">{file.birthRecord.nikIbu}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{file.birthRecord.puskesmas.nama}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{file.uploader.namaLengkap}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-slate-500">{formatDate(file.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file.birthRecord.id, file.id)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Unduh</span>
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
                  Halaman {page} dari {totalPages} ({total} dokumen)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sistem Pencatatan Nama Bayi Baru Lahir</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Puskesmas & Dukcapil Kabupaten Ngada</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">&copy; {new Date().getFullYear()} Kabupaten Ngada &middot; v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}