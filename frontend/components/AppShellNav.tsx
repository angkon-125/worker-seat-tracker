'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LucideLayoutDashboard,
  LucideBrain,
  LucideVideo,
  LucideSettings,
  LucideHistory,
  LucideMap,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: LucideLayoutDashboard },
  { href: '/intelligence', label: 'Intelligence', icon: LucideBrain },
  { href: '/floor-maps', label: 'Floor Maps', icon: LucideMap },
  { href: '/camera-feeds', label: 'Camera Feeds', icon: LucideVideo },
  { href: '/audit-logs', label: 'Audit Logs', icon: LucideHistory },
  { href: '/settings', label: 'Settings', icon: LucideSettings },
]

export default function AppShellNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2 flex-grow">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href

        return (
          <Link
            key={href}
            href={href}
            className={`surface-3d flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
              active
                ? 'text-white border-indigo-400/30 bg-indigo-500/12 shadow-lg shadow-indigo-500/10'
                : 'text-zinc-400 border-transparent hover:text-white hover:border-white/10 hover:bg-white/5'
            }`}
          >
            <Icon size={20} className={active ? 'text-indigo-300' : ''} />
            <span className="font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
