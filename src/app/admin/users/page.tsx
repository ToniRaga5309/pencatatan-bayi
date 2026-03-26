"use client"

// Halaman Kelola User (Admin) dengan fitur Hapus dan Input Puskesmas Manual
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, Users, Loader2, Plus, Edit, UserCheck, UserX, 
  Search, Shield, User, Trash2, AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserData {
  id: string
  username: string
  namaLengkap: string
  role: string
  isActive: boolean
  puskesmasId: string | null
  puskesmas: { nama: string } | null
  createdAt: Date
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  
  // Dialog states
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form data - puskesmasNama untuk input manual
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    namaLengkap: "",
    role: "OPERATOR",
    puskesmasNama: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Gagal memuat data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    // Validate
    const errors: Record<string, string> = {}
    if (!formData.username || formData.username.length < 4) {
      errors.username = "Username minimal 4 karakter"
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = "Password minimal 6 karakter"
    }
    if (!formData.namaLengkap || formData.namaLengkap.length < 3) {
      errors.namaLengkap = "Nama lengkap minimal 3 karakter"
    }
    if (formData.role === "OPERATOR" && !formData.puskesmasNama) {
      errors.puskesmasNama = "Nama puskesmas wajib diisi"
    }
    
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success("User berhasil ditambahkan")
        setShowAdd(false)
        resetForm()
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal menambahkan user")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleStatus = async (user: UserData) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: "POST"
      })
      
      if (response.ok) {
        toast.success(`User berhasil ${user.isActive ? "dinonaktifkan" : "diaktifkan"}`)
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal mengubah status")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    
    // Validate
    const errors: Record<string, string> = {}
    if (!formData.namaLengkap || formData.namaLengkap.length < 3) {
      errors.namaLengkap = "Nama lengkap minimal 3 karakter"
    }
    if (formData.role === "OPERATOR" && !formData.puskesmasNama) {
      errors.puskesmasNama = "Nama puskesmas wajib diisi"
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = "Password minimal 6 karakter"
    }
    
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap: formData.namaLengkap,
          role: formData.role,
          puskesmasNama: formData.role === "OPERATOR" ? formData.puskesmasNama : null,
          password: formData.password || undefined
        })
      })
      
      if (response.ok) {
        toast.success("User berhasil diperbarui")
        setShowEdit(false)
        resetForm()
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal memperbarui user")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast.success("User berhasil dihapus")
        setShowDelete(false)
        resetForm()
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || "Gagal menghapus user")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      namaLengkap: "",
      role: "OPERATOR",
      puskesmasNama: ""
    })
    setFormErrors({})
    setSelectedUser(null)
  }

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: "",
      namaLengkap: user.namaLengkap,
      role: user.role,
      puskesmasNama: user.puskesmas?.nama || ""
    })
    setFormErrors({})
    setShowEdit(true)
  }

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user)
    setShowDelete(true)
  }

  const filteredUsers = users.filter(u => {
    if (search && !u.namaLengkap.toLowerCase().includes(search.toLowerCase()) && 
        !u.username.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (roleFilter && roleFilter !== "all" && u.role !== roleFilter) {
      return false
    }
    return true
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kelola User</h1>
              <p className="text-sm text-slate-500">Manajemen akun pengguna sistem</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Daftar Pengguna
                </CardTitle>
                <CardDescription>Total {users.length} pengguna terdaftar</CardDescription>
              </div>
              <Button onClick={() => { resetForm(); setShowAdd(true) }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cari nama atau username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Semua Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Puskesmas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Tidak ada data ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.namaLengkap}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                            {u.role === "ADMIN" ? (
                              <><Shield className="w-3 h-3 mr-1" />Admin</>
                            ) : (
                              <><User className="w-3 h-3 mr-1" />Operator</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.puskesmas?.nama || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "default" : "destructive"} className={u.isActive ? "bg-green-600" : ""}>
                            {u.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(u)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleStatus(u)}
                              className={u.isActive ? "text-orange-600" : "text-green-600"}
                              title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(u)}
                              disabled={u.id === session.user.id}
                              title={u.id === session.user.id ? "Tidak dapat menghapus akun sendiri" : "Hapus"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Buat akun pengguna baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username <span className="text-red-500">*</span></Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
                placeholder="Minimal 4 karakter (huruf kecil)"
              />
              {formErrors.username && <p className="text-sm text-red-500">{formErrors.username}</p>}
            </div>
            <div>
              <Label>Password <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minimal 6 karakter"
              />
              {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
            </div>
            <div>
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input
                value={formData.namaLengkap}
                onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                placeholder="Nama lengkap pengguna"
              />
              {formErrors.namaLengkap && <p className="text-sm text-red-500">{formErrors.namaLengkap}</p>}
            </div>
            <div>
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v, puskesmasNama: v === "ADMIN" ? "" : formData.puskesmasNama})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator Puskesmas</SelectItem>
                  <SelectItem value="ADMIN">Admin Dukcapil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "OPERATOR" && (
              <div>
                <Label>Nama Puskesmas <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.puskesmasNama}
                  onChange={(e) => setFormData({...formData, puskesmasNama: e.target.value})}
                  placeholder="Contoh: Puskesmas Bajawa"
                  className={formErrors.puskesmasNama ? "border-red-500" : ""}
                />
                {formErrors.puskesmasNama && <p className="text-sm text-red-500">{formErrors.puskesmasNama}</p>}
                <p className="text-xs text-slate-500 mt-1">Ketik nama puskesmas secara manual</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm() }}>Batal</Button>
            <Button onClick={handleAddUser} disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Perbarui data pengguna</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={formData.username} disabled className="bg-slate-50" />
            </div>
            <div>
              <Label>Password Baru (kosongkan jika tidak ingin mengubah)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minimal 6 karakter"
              />
              {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
            </div>
            <div>
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input
                value={formData.namaLengkap}
                onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
              />
              {formErrors.namaLengkap && <p className="text-sm text-red-500">{formErrors.namaLengkap}</p>}
            </div>
            <div>
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v, puskesmasNama: v === "ADMIN" ? "" : formData.puskesmasNama})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator Puskesmas</SelectItem>
                  <SelectItem value="ADMIN">Admin Dukcapil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "OPERATOR" && (
              <div>
                <Label>Nama Puskesmas <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.puskesmasNama}
                  onChange={(e) => setFormData({...formData, puskesmasNama: e.target.value})}
                  placeholder="Contoh: Puskesmas Bajawa"
                  className={formErrors.puskesmasNama ? "border-red-500" : ""}
                />
                {formErrors.puskesmasNama && <p className="text-sm text-red-500">{formErrors.puskesmasNama}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); resetForm() }}>Batal</Button>
            <Button onClick={handleEditUser} disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Hapus User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.namaLengkap}</strong> ({selectedUser?.username})? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
