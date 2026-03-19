// Konfigurasi NextAuth.js untuk Sistem Pencatatan Nama Bayi Baru Lahir
// Menggunakan JWT strategy dengan role-based access control

import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"

// Ekstensi tipe untuk NextAuth
declare module "next-auth" {
  interface User {
    id: string
    username: string
    namaLengkap: string
    role: string
    puskesmasId: string | null
    puskesmasNama: string | null
  }
  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    namaLengkap: string
    role: string
    puskesmasId: string | null
    puskesmasNama: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Cari user berdasarkan username
        const user = await db.user.findUnique({
          where: { username: credentials.username },
          include: { puskesmas: true }
        })

        if (!user || !user.isActive) {
          return null
        }

        // Verifikasi password
        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordValid) {
          return null
        }

        // Catat audit log untuk login
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            details: JSON.stringify({ 
              loginTime: new Date().toISOString(),
              username: user.username 
            })
          }
        }).catch(() => {})

        return {
          id: user.id,
          username: user.username,
          namaLengkap: user.namaLengkap,
          role: user.role,
          puskesmasId: user.puskesmasId,
          puskesmasNama: user.puskesmas?.nama || null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.namaLengkap = user.namaLengkap
        token.role = user.role
        token.puskesmasId = user.puskesmasId
        token.puskesmasNama = user.puskesmasNama
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.namaLengkap = token.namaLengkap as string
        session.user.role = token.role as string
        session.user.puskesmasId = token.puskesmasId as string | null
        session.user.puskesmasNama = token.puskesmasNama as string | null
      }
      return session
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        try {
          await db.auditLog.create({
            data: {
              userId: token.id as string,
              action: "LOGOUT",
              entity: "User",
              details: JSON.stringify({ 
                logoutTime: new Date().toISOString()
              })
            }
          })
        } catch {
          // Ignore errors on logout
        }
      }
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 menit sesuai requirement
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
}

// Helper function untuk mendapatkan session di server-side
export async function getCurrentUser() {
  const { getServerSession } = await import("next-auth")
  const session = await getServerSession(authOptions)
  return session?.user
}

// Helper function untuk mengecek apakah user adalah admin
export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN"
}

// Helper function untuk mengecek apakah user adalah operator
export function isOperator(role: string | undefined): boolean {
  return role === "OPERATOR"
}
