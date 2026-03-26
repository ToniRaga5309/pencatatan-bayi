// Loading skeleton untuk halaman dashboard
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-64"></div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-5 w-5 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="flex gap-4 mb-6">
            <div className="h-10 bg-slate-200 rounded flex-1"></div>
            <div className="h-10 bg-slate-200 rounded w-32"></div>
            <div className="h-10 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
