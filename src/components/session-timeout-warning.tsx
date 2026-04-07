"use client"

// Session Timeout Warning Component
// Shows warning toast 2 minutes before session expires (15 min session)
import { useEffect, useState, useCallback, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"
import { Timer, AlertTriangle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SESSION_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const WARNING_BEFORE_EXPIRE_MS = 2 * 60 * 1000 // 2 minutes before expiry

export function SessionTimeoutWarning() {
  const { data: session, status, update } = useSession()
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [countdown, setCountdown] = useState(120)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const warningShownRef = useRef(false)
  const toastIdRef = useRef<string | number | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const dismissWarning = useCallback(() => {
    clearTimers()
    warningShownRef.current = false
    setCountdown(120)
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [clearTimers])

  const handleExtendSession = useCallback(async () => {
    try {
      await update()
      dismissWarning()
      toast.success("Sesi berhasil diperpanjang", {
        description: "Anda masih terautentikasi selama 15 menit lagi.",
        duration: 3000,
      })
    } catch {
      // If update fails, session might already be expired
      toast.error("Gagal memperpanjang sesi")
      setShowExpiredModal(true)
    }
  }, [update, dismissWarning])

  const handleLogout = useCallback(() => {
    dismissWarning()
    setShowExpiredModal(false)
    signOut({ callbackUrl: "/login" })
  }, [dismissWarning, signOut])

  useEffect(() => {
    // Only run for authenticated users
    if (status !== "authenticated" || !session) return

    // Calculate remaining session time based on JWT token
    // NextAuth JWT maxAge is 15 minutes, token.iat is the issued time
    const getTokenExpiry = (): number => {
      if (!session) return 0
      // We estimate expiry from the last activity/update time
      // Since we can't directly read JWT exp, we track from the component mount
      return SESSION_DURATION_MS
    }

    // Simple approach: track from when the component mounts or session updates
    const sessionStartRef = Date.now()
    warningShownRef.current = false

    const checkSession = () => {
      if (status !== "authenticated") {
        clearTimers()
        return
      }

      const elapsed = Date.now() - sessionStartRef
      const remaining = Math.max(0, getTokenExpiry() - elapsed)
      const warningTime = remaining - WARNING_BEFORE_EXPIRE_MS

      // Show warning 2 minutes before expiry
      if (warningTime <= 0 && !warningShownRef.current) {
        warningShownRef.current = true
        setCountdown(120)

        // Show countdown toast
        toastIdRef.current = toast.warning(
          "Sesi Anda akan segera berakhir",
          {
            description: `Sisa waktu: 2 menit. Klik untuk memperpanjang sesi.`,
            duration: Infinity,
            action: {
              label: (
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  Perpanjang Sesi
                </span>
              ),
              onClick: handleExtendSession,
            },
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          }
        )

        // Start countdown timer
        let remainingSeconds = 120
        intervalRef.current = setInterval(() => {
          remainingSeconds -= 1
          setCountdown(remainingSeconds)

          if (remainingSeconds <= 0) {
            clearTimers()
            setShowExpiredModal(true)
          }
        }, 1000)
      }
    }

    // Initial check after 1 second
    const initialTimeout = setTimeout(checkSession, 1000)
    // Check every 10 seconds
    const checkInterval = setInterval(checkSession, 10000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(checkInterval)
      clearTimers()
    }
  }, [status, session, clearTimers, handleExtendSession])

  // Listen for user activity to reset timer tracking
  useEffect(() => {
    if (status !== "authenticated") return

    const handleActivity = () => {
      // Activity keeps the session alive; if warning was shown and user is active, dismiss
      if (warningShownRef.current && countdown > 0) {
        // We don't auto-dismiss on activity; the warning is a deliberate notification
      }
    }

    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("keydown", handleActivity)
    window.addEventListener("scroll", handleActivity)
    window.addEventListener("click", handleActivity)

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("scroll", handleActivity)
      window.removeEventListener("click", handleActivity)
    }
  }, [status, countdown])

  if (status !== "authenticated") return null

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return (
    <>
      {/* Session Expired Modal */}
      <Dialog open={showExpiredModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Sesi Telah Berakhir
            </DialogTitle>
            <DialogDescription>
              Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali untuk melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleLogout} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Masuk Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
