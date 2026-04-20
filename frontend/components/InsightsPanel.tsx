'use client'

import { motion } from 'framer-motion'
import {
  LucideBrain, LucideZap, LucideMapPin, LucideClock,
  LucideTrophy, LucideWifi, LucideArrowRight
} from 'lucide-react'

interface InsightCard {
  insight: string
  value?: string | number
  seat_name?: string
  camera_name?: string
  hour?: number
  label?: string
  score?: number
  grade?: string
  health_pct?: number
  status?: string
}

interface InsightsPanelProps {
  data: {
    top_active_seat?: InsightCard
    least_active_zone?: InsightCard
    peak_activity_time?: InsightCard
    productivity_leader?: InsightCard
    camera_health?: InsightCard
  }
}

const insightConfigs = [
  {
    key: 'top_active_seat',
    label: 'Top Active Seat',
    icon: LucideTrophy,
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/25',
    iconColor: 'text-amber-400',
    accentColor: 'text-amber-300',
  },
  {
    key: 'peak_activity_time',
    label: 'Peak Hours',
    icon: LucideClock,
    gradient: 'from-indigo-500/20 to-purple-500/10',
    border: 'border-indigo-500/25',
    iconColor: 'text-indigo-400',
    accentColor: 'text-indigo-300',
  },
  {
    key: 'productivity_leader',
    label: 'Productivity Leader',
    icon: LucideZap,
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/25',
    iconColor: 'text-emerald-400',
    accentColor: 'text-emerald-300',
  },
  {
    key: 'least_active_zone',
    label: 'Needs Attention',
    icon: LucideMapPin,
    gradient: 'from-rose-500/15 to-pink-500/10',
    border: 'border-rose-500/25',
    iconColor: 'text-rose-400',
    accentColor: 'text-rose-300',
  },
  {
    key: 'camera_health',
    label: 'Network Health',
    icon: LucideWifi,
    gradient: 'from-cyan-500/15 to-blue-500/10',
    border: 'border-cyan-500/25',
    iconColor: 'text-cyan-400',
    accentColor: 'text-cyan-300',
  },
]

export default function InsightsPanel({ data }: InsightsPanelProps) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <LucideBrain className="text-indigo-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-outfit font-semibold">AI Insights</h3>
          <p className="text-xs text-zinc-400">Intelligence engine output</p>
        </div>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-lg animate-pulse">
          LIVE
        </span>
      </div>

      {/* Insight Cards */}
      <div className="flex flex-col gap-3">
        {insightConfigs.map(({ key, label, icon: Icon, gradient, border, iconColor, accentColor }, i) => {
          const item = data[key as keyof typeof data] as InsightCard | undefined
          if (!item) return null

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border bg-gradient-to-r ${gradient} ${border} group cursor-pointer hover:scale-[1.01] transition-transform`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={iconColor} size={18} />
              </div>
              <div className="flex-grow min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${accentColor} mb-1`}>{label}</p>
                <p className="text-sm text-zinc-200 leading-snug">{item.insight}</p>
                {item.score !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ delay: i * 0.07 + 0.3, duration: 0.8 }}
                        className="h-full bg-emerald-400 rounded-full"
                      />
                    </div>
                    <span className={`text-xs font-bold ${accentColor}`}>{item.score}/100</span>
                  </div>
                )}
                {item.health_pct !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.health_pct}%` }}
                        transition={{ delay: i * 0.07 + 0.3, duration: 0.8 }}
                        className={`h-full rounded-full ${item.health_pct === 100 ? 'bg-cyan-400' : item.health_pct > 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                      />
                    </div>
                    <span className={`text-xs font-bold ${accentColor}`}>{item.health_pct}%</span>
                  </div>
                )}
              </div>
              <LucideArrowRight className="flex-shrink-0 text-zinc-700 group-hover:text-zinc-400 transition-colors mt-0.5" size={14} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
