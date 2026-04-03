// Halaman Dashboard - Redirect berdasarkan role
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Redirect berdasarkan role
  if (user.role === "ADMIN") {
    redirect("/admin")
  } else {
    redirect("/operator")
  }
}
