"use client"

// Halaman Form Input Data Kelahiran
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ArrowLeft, Loader2, Save, Plus, AlertCircle, CheckCircle, Menu, LogOut, UserCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { toast } from "sonner"

export default function InputDataPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [saveAndContinue, setSaveAndContinue] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedBabyName, setSavedBabyName] = useState("")
  
  const [formData, setFormData] = useState({
    nikIbu: "",
    namaIbu: "",
    namaAyah: "",
    namaBayi: "",
    tanggalLahir: "",
    tempatLahir: "",
    jenisKelamin: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect jika belum login
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nikIbu) {
      newErrors.nikIbu = "NIK ibu wajib diisi"
    } else if (!/^\d{16}$/.test(formData.nikIbu)) {
      newErrors.nikIbu = "NIK harus 16 digit angka"
    }

    if (!formData.namaIbu || formData.namaIbu.length < 3) {
      newErrors.namaIbu = "Nama ibu minimal 3 karakter"
    }
    if (!formData.namaAyah || formData.namaAyah.length < 3) {
      newErrors.namaAyah = "Nama ayah minimal 3 karakter"
    }
    if (!formData.namaBayi || formData.namaBayi.length < 3) {
      newErrors.namaBayi = "Nama bayi minimal 3 karakter"
    }

    if (!formData.tanggalLahir) {
      newErrors.tanggalLahir = "Tanggal lahir wajib diisi"
    } else {
      const date = new Date(formData.tanggalLahir)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (date > today) {
        newErrors.tanggalLahir = "Tanggal lahir tidak boleh lebih dari hari ini"
      }
    }

    if (!formData.tempatLahir || formData.tempatLahir.length < 2) {
      newErrors.tempatLahir = "Tempat lahir minimal 2 karakter"
    }

    if (!formData.jenisKelamin) {
      newErrors.jenisKelamin = "Pilih jenis kelamin"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, continueInput: boolean = false) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi")
      return
    }

    setIsLoading(true)
    setSaveAndContinue(continueInput)

    try {
      const response = await fetch("/api/operator/birth-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nikIbu: formData.nikIbu,
          namaIbu: formData.namaIbu,
          namaAyah: formData.namaAyah,
          namaBayi: formData.namaBayi,
          tanggalLahir: formData.tanggalLahir,
          tempatLahir: formData.tempatLahir,
          jenisKelamin: formData.jenisKelamin
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Data berhasil disimpan")
        setSavedBabyName(formData.namaBayi.toUpperCase())
        
        if (continueInput) {
          setFormData({
            nikIbu: "",
            namaIbu: "",
            namaAyah: "",
            namaBayi: "",
            tanggalLahir: "",
            tempatLahir: "",
            jenisKelamin: ""
          })
          setErrors({})
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        } else {
          router.push("/operator/riwayat")
        }
      } else {
        toast.error(result.error || "Gagal menyimpan data")
        if (result.details) {
          const serverErrors: Record<string, string> = {}
          for (const [field, messages] of Object.entries(result.details)) {
            serverErrors[field] = (messages as string[])[0]
          }
          setErrors(serverErrors)
        }
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
      setSaveAndContinue(false)
    }
  }

  const handleNIKChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    const limitedValue = numericValue.slice(0, 16)
    
    setFormData(prev => ({ ...prev, nikIbu: limitedValue }))
    
    if (errors.nikIbu) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.nikIbu
        return newErrors
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

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
              <Link href="/operator">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Input Data Baru</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{session?.user?.puskesmasNama}</p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu Operator</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/operator">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/operator/riwayat">
                    <Plus className="w-4 h-4 mr-2" />
                    Riwayat Input
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/profile">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profil Saya
                  </Link>
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
        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              Data bayi <strong>{savedBabyName}</strong> berhasil disimpan. Silakan input data berikutnya.
            </AlertDescription>
          </Alert>
        )}

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Formulir Data Kelahiran
            </CardTitle>
            <CardDescription>
              Isi data kelahiran bayi dengan lengkap dan benar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              {/* NIK Ibu */}
              <div className="space-y-2">
                <Label htmlFor="nikIbu">
                  NIK Ibu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nikIbu"
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan 16 digit NIK ibu"
                  value={formData.nikIbu}
                  onChange={(e) => handleNIKChange(e.target.value)}
                  maxLength={16}
                  className={`font-mono tracking-wider input-enhanced focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${errors.nikIbu ? "border-red-500" : ""}`}
                />
                {errors.nikIbu ? (
                  <p className="text-sm text-red-500">{errors.nikIbu}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    NIK harus tepat 16 digit angka ({formData.nikIbu.length}/16 digit)
                  </p>
                )}
              </div>

              {/* Nama Ibu */}
              <div className="space-y-2">
                <Label htmlFor="namaIbu">
                  Nama Ibu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaIbu"
                  placeholder="Masukkan nama lengkap ibu"
                  value={formData.namaIbu}
                  onChange={(e) => handleInputChange("namaIbu", e.target.value)}
                  className={errors.namaIbu ? "border-red-500 focus-visible:ring-red-500" : "input-enhanced focus-visible:ring-emerald-500 focus-visible:border-emerald-500"}
                />
                {errors.namaIbu && (
                  <p className="text-sm text-red-500">{errors.namaIbu}</p>
                )}
              </div>

              {/* Nama Ayah */}
              <div className="space-y-2">
                <Label htmlFor="namaAyah">
                  Nama Ayah <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaAyah"
                  placeholder="Masukkan nama lengkap ayah"
                  value={formData.namaAyah}
                  onChange={(e) => handleInputChange("namaAyah", e.target.value)}
                  className={errors.namaAyah ? "border-red-500 focus-visible:ring-red-500" : "input-enhanced focus-visible:ring-emerald-500 focus-visible:border-emerald-500"}
                />
                {errors.namaAyah && (
                  <p className="text-sm text-red-500">{errors.namaAyah}</p>
                )}
              </div>

              {/* Nama Bayi */}
              <div className="space-y-2">
                <Label htmlFor="namaBayi">
                  Nama Bayi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaBayi"
                  placeholder="Masukkan nama bayi"
                  value={formData.namaBayi}
                  onChange={(e) => handleInputChange("namaBayi", e.target.value)}
                  className={errors.namaBayi ? "border-red-500 focus-visible:ring-red-500" : "input-enhanced focus-visible:ring-emerald-500 focus-visible:border-emerald-500"}
                />
                {errors.namaBayi && (
                  <p className="text-sm text-red-500">{errors.namaBayi}</p>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => handleInputChange("tanggalLahir", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={errors.tanggalLahir ? "border-red-500 focus-visible:ring-red-500" : "input-enhanced focus-visible:ring-emerald-500 focus-visible:border-emerald-500"}
                />
                {errors.tanggalLahir && (
                  <p className="text-sm text-red-500">{errors.tanggalLahir}</p>
                )}
              </div>

              {/* Tempat Lahir */}
              <div className="space-y-2">
                <Label htmlFor="tempatLahir">
                  Tempat Lahir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tempatLahir"
                  placeholder="Contoh: RSUD Kota Bandung"
                  value={formData.tempatLahir}
                  onChange={(e) => handleInputChange("tempatLahir", e.target.value)}
                  className={errors.tempatLahir ? "border-red-500 focus-visible:ring-red-500" : "input-enhanced focus-visible:ring-emerald-500 focus-visible:border-emerald-500"}
                />
                {errors.tempatLahir && (
                  <p className="text-sm text-red-500">{errors.tempatLahir}</p>
                )}
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.jenisKelamin} 
                  onValueChange={(value) => handleInputChange("jenisKelamin", value)}
                >
                  <SelectTrigger className={errors.jenisKelamin ? "border-red-500" : ""}>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jenisKelamin && (
                  <p className="text-sm text-red-500">{errors.jenisKelamin}</p>
                )}
              </div>

              {/* Puskesmas (Read-only) */}
              <div className="space-y-2">
                <Label>Puskesmas</Label>
                <Input
                  value={session?.user?.puskesmasNama || ""}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">Otomatis terisi berdasarkan akun yang login</p>
              </div>

              {/* Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Data yang disimpan akan masuk ke status &quot;Menunggu&quot; dan memerlukan verifikasi dari Admin Dukcapil.
                </AlertDescription>
              </Alert>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/20 btn-emerald-hover"
                  disabled={isLoading}
                >
                  {isLoading && !saveAndContinue ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 btn-hover"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading}
                >
                  {isLoading && saveAndContinue ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Simpan &amp; Input Lagi
                    </>
                  )}
                </Button>
              </div>
            </form>
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
