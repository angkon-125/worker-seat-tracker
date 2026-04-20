'use client'

import { motion } from 'framer-motion'
import { LucideZap, LucideMedal } from 'lucide-react'

interface Score {
  seat_id: number
  seat_name: string
  score: number
  grade: string
  breakdown?: {
    time_score: number
    consistency_score: number
    break_score: number
    active_minutes_7d: number
  }
}

interface ScoresPanelProps {
  scores: Score[]
}

const gradeConfig: Record<string, { color: string; bg: string; border: string }> = {
  A: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  B: { color: 'text-teal-400',    bg: 'bg-teal-500/15',    border: 'border-teal-500/30' },
  C: { color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30' },
  D: { color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30' },
  F: { color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/30' },
  'N/A': { color: 'text-zinc-500', bg: 'bg-zinc-500/10',   border: 'border-zinc-500/20' },
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 flex-grow bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  )
}

export default function ScoresPanel({ scores }: ScoresPanelProps) {
  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <LucideZap className="text-amber-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-outfit font-semibold">Productivity Scores</h3>
          <p className="text-xs text-zinc-400">7-day weighted performance analysis</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {top3.map((s, i) => {
            const gc = gradeConfig[s.grade] ?? gradeConfig['N/A']
            const medals = ['🥇', '🥈', '🥉']
            return (
              <motion.div
                key={s.seat_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${gc.bg} ${gc.border}`}
              >
                <span className="text-2xl">{medals[i]}</span>
                <span className="text-xs font-bold text-white">{s.seat_name}</span>
                <span className={`text-2xl font-outfit font-extrabold ${gc.color}`}>{s.score}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${gc.bg} ${gc.color} border ${gc.border}`}>
                  Grade {s.grade}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detailed breakdown list */}
      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
        {scores.map((s, i) => {
          const gc = gradeConfig[s.grade] ?? gradeConfig['N/A']
          const pct = Math.round(s.score)
          return (
            <motion.div
              key={s.seat_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <span className="text-xs text-zinc-500 w-5 text-right">{i + 1}</span>
              <span className="text-sm font-medium w-10 text-white">{s.seat_name}</span>
              <ScoreBar value={pct} max={100} color={
                pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-teal-400' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-400'
              } />
              <span className="text-sm font-bold text-zinc-300 w-8 text-right">{pct}</span>
              <span className={`text-[10px] font-extrabold w-8 text-center px-1.5 py-0.5 rounded-md ${gc.bg} ${gc.color} border ${gc.border}`}>
                {s.grade}
              </span>
            </motion.div>
          )
        })}

        {scores.length === 0 && (
          <div className="flex items-center justify-center py-8 text-zinc-600 text-sm gap-2">
            <LucideMedal size={20} />
            <span>No score data available yet</span>
          </div>
        )}
      </div>
    </div>
  )
}
