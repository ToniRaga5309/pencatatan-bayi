"use client"

// Session Provider untuk NextAuth.js
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={5 * 60} // Refresh session setiap 5 menit
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
