"use client"

// Halaman Kelola Puskesmas (Admin)
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ArrowLeft, Loader2, Building, Edit, Save,
  Menu, IdCard, Users, ClipboardList, UserCircle, LogOut
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { toast } from "sonner"

interface PuskesmasData {
  id: string
  nama: string
  kodeWilayah: string
  alamat: string | null
  telepon: string | null
  _count: { birthRecords: number }
}

export default function PuskesmasManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [puskesmasList, setPuskesmasList] = useState<PuskesmasData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false)
  const [selectedPuskesmas, setSelectedPuskesmas] = useState<PuskesmasData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    kodeWilayah: "",
    alamat: "",
    telepon: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status !== "loading" && session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/puskesmas")
      if (response.ok) {
        const data = await response.json()
        setPuskesmasList(data)
      }
    } catch (error) {
      console.error("Error fetching puskesmas:", error)
      toast.error("Gagal memuat data puskesmas")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (item: PuskesmasData) => {
    setSelectedPuskesmas(item)
    setFormData({
      nama: item.nama,
      kodeWilayah: item.kodeWilayah || "",
      alamat: item.alamat || "",
      telepon: item.telepon || ""
    })
    setFormErrors({})
    setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!selectedPuskesmas) return

    // Validate
    const errors: Record<string, string> = {}
    if (!formData.nama || formData.nama.length < 3) {
      errors.nama = "Nama minimal 3 karakter"
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/puskesmas/${selectedPuskesmas.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Puskesmas "${formData.nama}" berhasil diperbarui`)
        setShowEdit(false)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memperbarui puskesmas")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  const totalRecords = puskesmasList.reduce((sum, p) => sum + p._count.birthRecords, 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-fadeIn">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Kelola Puskesmas
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manajemen data puskesmas</p>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/audit-log">
                <ClipboardList className="w-4 h-4 mr-2" />
                Audit Log
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/nik-bayi">
                <IdCard className="w-4 h-4 mr-2" />
                NIK Bayi
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Kelola User
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href="/profile" title="Profil Saya">
                <UserCircle className="w-4 h-4" />
              </Link>
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
          {/* Mobile Nav */}
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
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2 py-1">{session.user.namaLengkap}</span>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/audit-log">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Audit Log
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/nik-bayi">
                    <IdCard className="w-4 h-4 mr-2" />
                    NIK Bayi
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/admin/users">
                    <Users className="w-4 h-4 mr-2" />
                    Kelola User
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/profile">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profil Saya
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start mt-4 text-red-600 hover:text-red-700" onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Stats Card */}
        <Card className="mb-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
          <CardContent className="pt-6 pl-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Puskesmas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isLoading ? "..." : puskesmasList.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">{isLoading ? "..." : `${totalRecords} data kelahiran tercatat`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Daftar Puskesmas
            </CardTitle>
            <CardDescription>Data puskesmas yang terdaftar dalam sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kode Wilayah</TableHead>
                    <TableHead className="hidden md:table-cell">Alamat</TableHead>
                    <TableHead className="hidden lg:table-cell">Telepon</TableHead>
                    <TableHead className="text-center">Jumlah Data</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : puskesmasList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Building className="w-10 h-10" />
                          <p className="text-sm">Belum ada data puskesmas</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    puskesmasList.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/20">
                        <TableCell className="text-slate-500 text-sm">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.nama}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{item.kodeWilayah || "-"}</code>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {item.alamat || "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-600 dark:text-slate-400">
                          {item.telepon || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            {item._count.birthRecords}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            onClick={() => openEditDialog(item)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-emerald-600" />
              Edit Puskesmas
            </DialogTitle>
            <DialogDescription>Perbarui data puskesmas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Nama Puskesmas <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama puskesmas"
                className={formErrors.nama ? "border-red-500" : ""}
              />
              {formErrors.nama && <p className="text-sm text-red-500 mt-1">{formErrors.nama}</p>}
            </div>
            <div>
              <Label>Kode Wilayah</Label>
              <Input
                value={formData.kodeWilayah}
                onChange={(e) => setFormData({ ...formData, kodeWilayah: e.target.value })}
                placeholder="Kode wilayah"
              />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap"
              />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="Nomor telepon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Batal</Button>
            <Button
              onClick={handleEdit}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Simpan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
