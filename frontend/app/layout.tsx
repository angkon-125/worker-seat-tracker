import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { LucideLayoutDashboard } from 'lucide-react'
import AppShellNav from '@/components/AppShellNav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Worker Seat Tracker | Pro',
  description: 'AI-Powered Workplace Occupancy Monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-inter`}>
        <div className="flex min-h-screen bg-black text-white">
          {/* Sidebar */}
          <aside className="w-72 border-r border-white/10 p-6 flex flex-col gap-8 bg-zinc-950/40 backdrop-blur-md hidden md:flex">
            <div className="flex items-center gap-3">
              <div className="surface-3d w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <LucideLayoutDashboard size={24} />
              </div>
              <span className="font-outfit font-bold text-xl tracking-tight">Tracker.AI</span>
            </div>

            <AppShellNav />

            <div className="glass-card surface-3d p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="status-pulse bg-emerald-500" />
                <span>System Online</span>
              </div>
              <p className="text-xs text-zinc-400">YOLOv8 Core v1.0.4</p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-grow flex flex-col h-screen overflow-y-auto">
            <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-zinc-950/20 backdrop-blur-sm sticky top-0 z-40">
              <div>
                <h1 className="font-outfit font-semibold text-2xl">Executive Dashboard</h1>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 mt-1">Spatial Operations Layer</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="panel-depth rounded-2xl px-4 py-2 text-right hidden sm:block">
                  <p className="text-sm font-medium">Headquarters</p>
                  <p className="text-xs text-zinc-400">Main Office Zone A</p>
                </div>
                <div className="surface-3d w-10 h-10 rounded-full bg-zinc-800 border border-white/10" title="User Profile" />
              </div>
            </header>
            
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
