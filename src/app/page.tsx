// Halaman Utama - Landing Page untuk pengguna belum login
// Pengguna yang sudah login akan di-redirect ke dashboard sesuai role
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import LandingPageContent from "@/components/landing-page-content"

export default async function HomePage() {
  const user = await getCurrentUser()

  // Redirect authenticated users to their dashboard
  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin")
    } else if (user.role === "BPJS") {
      redirect("/bpjs")
    } else {
      redirect("/operator")
    }
  }

  // Show landing page for unauthenticated users
  return <LandingPageContent />
}
