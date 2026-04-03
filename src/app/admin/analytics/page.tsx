"use client"

// Halaman Analitik Data (Admin)
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ArrowLeft, Loader2, Menu, BarChart3, TrendingUp,
  CalendarDays, Filter, CheckCircle, IdCard, Baby,
  ClipboardList, Users, LogOut, UserCircle
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend
} from "recharts"

interface AnalyticsData {
  monthlyTrend: Array<{ month: string; total: number; verified: number; rejected: number; pending: number }>
  genderDistribution: Array<{ gender: string; count: number }>
  puskesmasRanking: Array<{ nama: string; count: number }>
  nikProgress: Array<{ month: string; withNik: number; withoutNik: number }>
  summary: { total: number; avgPerMonth: number; verificationRate: number; nikRate: number }
}

const GENDER_COLORS = ["#0d9488", "#f43f5e"] // teal for male, rose for female
const TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Date range
  const now = new Date()
  const currentYear = now.getFullYear()
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status !== "loading" && session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAnalytics()
    }
  }, [session, startDate, endDate])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("startDate", startDate)
      params.append("endDate", endDate)
      const response = await fetch(`/api/admin/analytics?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
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
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Analitik Data
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Statistik dan tren data kelahiran</p>
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
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
                onClick={() => router.push("/profile")}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {session.user.namaLengkap.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline">{session.user.namaLengkap}</span>
              </button>
            </div>
            <Button variant="outline" size="icon" asChild className="hidden sm:flex">
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
        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  <CalendarDays className="w-4 h-4 inline mr-1.5 text-emerald-600" />
                  Periode Analitik
                </Label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="flex-1 w-full">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <span className="text-slate-400 text-sm">sampai</span>
                  <div className="flex-1 w-full">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={fetchAnalytics}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Filter className="w-4 h-4 mr-2" />
                    )}
                    Terapkan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-1">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Data</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="pl-4">
                <div className="text-2xl font-bold animate-countUp">{data.summary.total}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Periode terpilih</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-2">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-emerald-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Rata-rata / Bulan</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
              </CardHeader>
              <CardContent className="pl-4">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 animate-countUp">{data.summary.avgPerMonth}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelahiran per bulan</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-3">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Tingkat Verifikasi</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="pl-4">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 animate-countUp">{data.summary.verificationRate}%</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data terverifikasi</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-md transition-shadow animate-stagger-4">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-teal-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pl-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">Tingkat NIK</CardTitle>
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <IdCard className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent className="pl-4">
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 animate-countUp">{data.summary.nikRate}%</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bayi memiliki NIK</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Charts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart 1: Area Chart - Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Tren Data Kelahiran
                </CardTitle>
                <CardDescription>Total bulanan dengan status verifikasi</CardDescription>
              </CardHeader>
              <CardContent>
                {data.monthlyTrend.some((d) => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="total" name="Total" stroke="#059669" strokeWidth={2} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="verified" name="Terverifikasi" stroke="#10b981" strokeWidth={1.5} fill="url(#colorVerified)" />
                      <Area type="monotone" dataKey="pending" name="Menunggu" stroke="#f59e0b" strokeWidth={1.5} fill="url(#colorPending)" />
                      <Area type="monotone" dataKey="rejected" name="Ditolak" stroke="#ef4444" strokeWidth={1.5} fill="url(#colorRejected)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    Belum ada data untuk periode ini
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Bar Chart - Puskesmas Ranking */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Perbandingan Puskesmas
                </CardTitle>
                <CardDescription>Peringkat berdasarkan jumlah data kelahiran</CardDescription>
              </CardHeader>
              <CardContent>
                {data.puskesmasRanking.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, data.puskesmasRanking.length * 36)}>
                    <BarChart data={data.puskesmasRanking} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                      <YAxis type="category" dataKey="nama" tick={{ fontSize: 11, fill: "#94a3b8" }} width={140} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [value, "Data"]} />
                      <Bar dataKey="count" name="Data" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 3: Pie/Donut Chart - Gender Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Baby className="w-4 h-4 text-emerald-600" />
                  Distribusi Jenis Kelamin
                </CardTitle>
                <CardDescription>Rasio laki-laki dan perempuan</CardDescription>
              </CardHeader>
              <CardContent>
                {data.genderDistribution.length > 0 ? (
                  <div className="flex flex-col items-center gap-4">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={data.genderDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="count"
                          label={({ gender, percent }) => `${gender} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.genderDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [value, "Jumlah"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6">
                      {data.genderDistribution.map((item, index) => (
                        <div key={item.gender} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS[index % GENDER_COLORS.length] }} />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {item.gender}: <strong>{item.count}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 4: Line Chart - NIK Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IdCard className="w-4 h-4 text-cyan-600" />
                  Progres NIK Bayi
                </CardTitle>
                <CardDescription>Perkembangan penerbitan NIK bayi per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                {data.nikProgress.some((d) => d.withNik > 0 || d.withoutNik > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.nikProgress} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="withNik"
                        name="Sudah NIK"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        dot={{ fill: "#0d9488", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="withoutNik"
                        name="Belum NIK"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={{ fill: "#f59e0b", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                    Belum ada data untuk periode ini
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
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
