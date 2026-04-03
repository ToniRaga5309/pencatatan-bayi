"use client"

// Landing Page Content - Shown to unauthenticated visitors
// Enhanced with animated gradient hero, glassmorphism cards, animated counters, hover animations, multi-layer waves, CTA glow
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Baby, Shield, ClipboardList, HeartPulse, Building, Users, Zap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

// Animated counter component
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [hasStarted, target, duration])

  return <span ref={ref}>{count}</span>
}

// Feature card with glassmorphism and hover effects
function FeatureCard({
  icon: Icon,
  title,
  description,
  colorClass,
  delay = 0
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  colorClass: string
  delay?: number
}) {
  const hoverColors: Record<string, string> = {
    emerald: "hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/10",
    teal: "hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-100/50 dark:hover:shadow-teal-900/10",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`group relative p-6 rounded-2xl glass-card-deep ${hoverColors[colorClass] || ""} transition-all duration-300 cursor-default`}
    >
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-transparent group-hover:from-emerald-50/30 dark:group-hover:from-emerald-900/10 transition-all duration-300 pointer-events-none" />

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-${colorClass === "teal" ? "teal" : "emerald"}-100 dark:bg-${colorClass === "teal" ? "teal" : "emerald"}-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 text-${colorClass === "teal" ? "teal" : "emerald"}-600 dark:text-${colorClass === "teal" ? "teal" : "emerald"}-400`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col animate-page-transition">
      {/* Hero Section with animated gradient */}
      <section className="relative overflow-hidden text-white animate-hero-gradient"
        style={{
          background: "linear-gradient(135deg, #047857 0%, #059669 25%, #0d9488 50%, #059669 75%, #047857 100%)",
          backgroundSize: "400% 400%"
        }}
      >
        {/* Animated floating circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 animate-[float_20s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 -right-16 w-56 h-56 rounded-full bg-white/5 animate-[float_15s_ease-in-out_infinite_2s]" />
          <div className="absolute -bottom-12 left-1/3 w-40 h-40 rounded-full bg-white/5 animate-[float_18s_ease-in-out_infinite_4s]" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/8 animate-[float_12s_ease-in-out_infinite_1s]" />
          <div className="absolute bottom-1/4 -left-8 w-28 h-28 rounded-full bg-white/5 animate-[float_22s_ease-in-out_infinite_3s]" />
          <div className="absolute top-10 right-1/3 w-16 h-16 rounded-full bg-white/5 animate-[float_16s_ease-in-out_infinite_5s]" />
          <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5 animate-[float_19s_ease-in-out_infinite_2s]" />
          <div className="absolute top-2/3 left-1/4 w-24 h-24 rounded-full bg-white/[0.03] animate-[float_25s_ease-in-out_infinite_6s]" />
          <div className="absolute top-16 left-1/2 w-12 h-12 rounded-full bg-white/[0.04] animate-[float_14s_ease-in-out_infinite_3s]" />

          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px"
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            {/* App Icon with animated glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20"
            >
              <Baby className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.4)]" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 tracking-tight"
            >
              Sistem Pencatatan
              <br />
              <span className="text-emerald-100">Bayi Baru Lahir</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-emerald-100 text-base sm:text-lg mb-2 font-medium"
            >
              Kabupaten Ngada, NTT
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-emerald-200/80 text-sm sm:text-base mb-10 max-w-xl"
            >
              Puskesmas & Dinas Kependudukan dan Pencatatan Sipil
            </motion.p>

            {/* CTA Button with glow effect */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Link
                href="/login"
                className="relative inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:bg-emerald-50 transition-all duration-300 hover:scale-[1.03] group animate-cta-glow"
              >
                {/* Ripple rings on hover */}
                <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <span className="absolute inset-0 bg-emerald-100/0 group-hover:bg-emerald-100/20 transition-colors duration-300 rounded-xl" />
                </span>
                <span className="relative z-10 flex items-center gap-2">
                  Masuk ke Sistem
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Multi-layer wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            {/* Layer 1 - back, lightest */}
            <path d="M0 80C180 40 360 100 540 70C720 40 900 90 1080 60C1260 30 1350 50 1440 40V120H0V80Z" fill="currentColor" className="text-emerald-50 dark:text-slate-800/40" opacity="0.5" />
            {/* Layer 2 - middle */}
            <path d="M0 90C240 50 480 110 720 80C960 50 1200 100 1440 70V120H0V90Z" fill="currentColor" className="text-emerald-50/70 dark:text-slate-800/60" />
            {/* Layer 3 - front, main */}
            <path d="M0 100C200 70 400 110 600 90C800 70 1000 105 1200 85C1350 70 1440 95 1440 95V120H0V100Z" fill="currentColor" className="text-white dark:text-slate-900" />
          </svg>
        </div>
      </section>

      {/* Feature Cards with dot pattern background */}
      <section className="relative py-16 sm:py-20 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #059669 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Fitur Utama Sistem
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Tiga pilar utama yang mendukung pencatatan kelahiran bayi di Kabupaten Ngada
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <FeatureCard
              icon={Shield}
              title="Verifikasi Data"
              description="Admin Dukcapil memverifikasi data kelahiran dari puskesmas"
              colorClass="emerald"
              delay={0.1}
            />
            <FeatureCard
              icon={ClipboardList}
              title="Pencatatan Data"
              description="Operator Puskesmas mencatat data bayi baru lahir"
              colorClass="teal"
              delay={0.2}
            />
            <FeatureCard
              icon={HeartPulse}
              title="Data BPJS"
              description="BPJS Kesehatan mengakses data NIK bayi terdaftar"
              colorClass="emerald"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Counters */}
      <section className="py-14 sm:py-16 bg-slate-50 dark:bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              className="text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter target={12} />
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Puskesmas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                <AnimatedCounter target={3} />
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Peran Pengguna</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Terintegrasi
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sistem</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Mulai Kelola Data Kelahiran
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Sistem terintegrasi untuk pencatatan dan pengelolaan data bayi baru lahir di Kabupaten Ngada
            </p>
            <Link
              href="/login"
              className="relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.03] group animate-cta-glow"
            >
              Masuk ke Sistem
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                Sistem Pencatatan Bayi Baru Lahir
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Pemerintah Kabupaten Ngada &mdash; Dinas Kependudukan dan Pencatatan Sipil
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              &copy; {new Date().getFullYear()} Kabupaten Ngada, Nusa Tenggara Timur
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
