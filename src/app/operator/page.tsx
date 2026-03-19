"use client"

// Dashboard Operator Puskesmas
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Baby, Clock, CheckCircle, XCircle, Plus, FileText, Loader2, LogOut } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalBulanIni: number
  totalPending: number
  totalVerified: number
  totalRejected: number
}

export default function OperatorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/operator/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== "OPERATOR") {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard Operator</h1>
            <p className="text-sm text-slate-500">{session.user.puskesmasNama}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Halo, {session.user.namaLengkap}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Data Bulan Ini
              </CardTitle>
              <Baby className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalBulanIni ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Bayi tercatat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Menunggu Verifikasi
              </CardTitle>
              <Clock className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats?.totalPending ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Data pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Terverifikasi
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.totalVerified ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Data valid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Ditolak
              </CardTitle>
              <XCircle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.totalRejected ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Perlu perbaikan</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/operator/input" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Input Data Baru</h3>
                  <p className="text-sm text-slate-500">Tambahkan data bayi baru lahir</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/operator/riwayat" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="w-7 h-7 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Riwayat Input</h3>
                  <p className="text-sm text-slate-500">Lihat dan edit data yang sudah diinput</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
            <CardDescription>Data yang baru saja diinput</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentRecords />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Komponen untuk menampilkan data terbaru
function RecentRecords() {
  const [records, setRecords] = useState<Array<{
    id: string
    namaBayi: string
    namaIbu: string
    status: string
    createdAt: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentRecords()
  }, [])

  const fetchRecentRecords = async () => {
    try {
      const response = await fetch("/api/operator/recent-records")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error("Error fetching recent records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Belum ada data. Klik &quot;Input Data Baru&quot; untuk memulai.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div 
          key={record.id} 
          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
        >
          <div>
            <p className="font-medium">{record.namaBayi}</p>
            <p className="text-sm text-slate-500">Ibu: {record.namaIbu}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              record.status === "PENDING" 
                ? "bg-amber-100 text-amber-700" 
                : record.status === "VERIFIED"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {record.status === "PENDING" ? "Menunggu" : record.status === "VERIFIED" ? "Terverifikasi" : "Ditolak"}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(record.createdAt).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
