"use client"

// Halaman Form Input Data Kelahiran
// Urutan sesuai format Excel: Nama Bayi, Tempat, Tanggal Lahir, JK, NIK Ibu, Nama Ibu, Nama Ayah, Puskesmas
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Save, Plus, AlertCircle, CheckCircle } from "lucide-react"
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
    namaBayi: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "",
    nikIbu: "",
    namaIbu: "",
    namaAyah: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect jika belum login
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validasi Nama Bayi
    if (!formData.namaBayi || formData.namaBayi.length < 2) {
      newErrors.namaBayi = "Nama bayi minimal 2 karakter"
    }

    // Validasi tempat lahir
    if (!formData.tempatLahir || formData.tempatLahir.length < 2) {
      newErrors.tempatLahir = "Tempat lahir minimal 2 karakter"
    }

    // Validasi tanggal lahir
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

    // Validasi jenis kelamin
    if (!formData.jenisKelamin) {
      newErrors.jenisKelamin = "Pilih jenis kelamin"
    }

    // Validasi NIK
    if (!formData.nikIbu) {
      newErrors.nikIbu = "NIK ibu wajib diisi"
    } else if (!/^\d{16}$/.test(formData.nikIbu)) {
      newErrors.nikIbu = "NIK harus 16 digit angka"
    }

    // Validasi nama ibu
    if (!formData.namaIbu || formData.namaIbu.length < 3) {
      newErrors.namaIbu = "Nama ibu minimal 3 karakter"
    }

    // Nama ayah bersifat OPSIONAL - tidak ada validasi wajib
    // Jika diisi, minimal 2 karakter
    if (formData.namaAyah && formData.namaAyah.length > 0 && formData.namaAyah.length < 2) {
      newErrors.namaAyah = "Nama ayah minimal 2 karakter"
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
          namaAyah: formData.namaAyah || "-", // Default ke "-" jika kosong
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
          // Reset form untuk input berikutnya
          setFormData({
            namaBayi: "",
            tempatLahir: "",
            tanggalLahir: "",
            jenisKelamin: "",
            nikIbu: "",
            namaIbu: "",
            namaAyah: ""
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

  // Handler khusus untuk NIK - hanya menerima angka, maksimal 16 digit
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
            <h1 className="text-xl font-bold text-slate-900">Input Data Baru</h1>
            <p className="text-sm text-slate-500">{session?.user?.puskesmasNama}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Data bayi <strong>{savedBabyName}</strong> berhasil disimpan. Silakan input data berikutnya.
            </AlertDescription>
          </Alert>
        )}

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Formulir Data Kelahiran</CardTitle>
            <CardDescription>
              Isi data kelahiran bayi dengan lengkap dan benar sesuai urutan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              {/* 1. Nama Bayi */}
              <div className="space-y-2">
                <Label htmlFor="namaBayi">
                  Nama Bayi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaBayi"
                  placeholder="Masukkan nama bayi"
                  value={formData.namaBayi}
                  onChange={(e) => handleInputChange("namaBayi", e.target.value)}
                  className={errors.namaBayi ? "border-red-500" : ""}
                />
                {errors.namaBayi && (
                  <p className="text-sm text-red-500">{errors.namaBayi}</p>
                )}
              </div>

              {/* 2. Tempat Lahir */}
              <div className="space-y-2">
                <Label htmlFor="tempatLahir">
                  Tempat Lahir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tempatLahir"
                  placeholder="Contoh: RSUD Bajawa, Puskesmas Mataloko"
                  value={formData.tempatLahir}
                  onChange={(e) => handleInputChange("tempatLahir", e.target.value)}
                  className={errors.tempatLahir ? "border-red-500" : ""}
                />
                {errors.tempatLahir && (
                  <p className="text-sm text-red-500">{errors.tempatLahir}</p>
                )}
              </div>

              {/* 3. Tanggal Lahir */}
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
                  className={errors.tanggalLahir ? "border-red-500" : ""}
                />
                {errors.tanggalLahir && (
                  <p className="text-sm text-red-500">{errors.tanggalLahir}</p>
                )}
              </div>

              {/* 4. Jenis Kelamin */}
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
                    <SelectItem value="LAKI_LAKI">Laki-laki (L)</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jenisKelamin && (
                  <p className="text-sm text-red-500">{errors.jenisKelamin}</p>
                )}
              </div>

              {/* 5. NIK Ibu */}
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
                  className={`font-mono tracking-wider ${errors.nikIbu ? "border-red-500" : ""}`}
                />
                {errors.nikIbu ? (
                  <p className="text-sm text-red-500">{errors.nikIbu}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    NIK harus tepat 16 digit angka ({formData.nikIbu.length}/16 digit)
                  </p>
                )}
              </div>

              {/* 6. Nama Ibu */}
              <div className="space-y-2">
                <Label htmlFor="namaIbu">
                  Nama Ibu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaIbu"
                  placeholder="Masukkan nama lengkap ibu"
                  value={formData.namaIbu}
                  onChange={(e) => handleInputChange("namaIbu", e.target.value)}
                  className={errors.namaIbu ? "border-red-500" : ""}
                />
                {errors.namaIbu && (
                  <p className="text-sm text-red-500">{errors.namaIbu}</p>
                )}
              </div>

              {/* 7. Nama Ayah - OPSIONAL */}
              <div className="space-y-2">
                <Label htmlFor="namaAyah">
                  Nama Ayah <span className="text-slate-400 text-xs">(Opsional)</span>
                </Label>
                <Input
                  id="namaAyah"
                  placeholder="Masukkan nama lengkap ayah (jika ada)"
                  value={formData.namaAyah}
                  onChange={(e) => handleInputChange("namaAyah", e.target.value)}
                  className={errors.namaAyah ? "border-red-500" : ""}
                />
                {errors.namaAyah && (
                  <p className="text-sm text-red-500">{errors.namaAyah}</p>
                )}
              </div>

              {/* 8. Puskesmas (Read-only - otomatis dari akun login) */}
              <div className="space-y-2">
                <Label>Puskesmas</Label>
                <Input
                  value={session?.user?.puskesmasNama || "-"}
                  disabled
                  className="bg-slate-100 font-medium"
                />
                <p className="text-xs text-slate-500">Otomatis terisi berdasarkan akun operator yang login</p>
              </div>

              {/* Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Data yang disimpan akan langsung terverifikasi dan tercatat dalam sistem.
                </AlertDescription>
              </Alert>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
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
                  className="flex-1"
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
    </div>
  )
}
