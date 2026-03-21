// Layout utama untuk Sistem Pencatatan Nama Bayi Baru Lahir
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sistem Pencatatan Nama Bayi Baru Lahir",
  description: "Sistem untuk mencatat data kelahiran bayi baru lahir di Puskesmas dan diverifikasi oleh Dukcapil",
  keywords: ["Puskesmas", "Dukcapil", "Kelahiran", "Bayi", "Sistem Informasi"],
  authors: [{ name: "Dinas Kesehatan & Dukcapil" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
