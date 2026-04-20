'use client'

import { motion } from 'framer-motion'
import { LucideThermometer } from 'lucide-react'

interface HeatmapCell {
  seat_id: number
  seat_name: string
  x_min: number
  y_min: number
  x_max: number
  y_max: number
  intensity: number
  activity_count: number
}

interface HeatmapViewProps {
  cells: HeatmapCell[]
  title?: string
}

function intensityToColor(intensity: number): string {
  if (intensity === 0) return 'rgba(255,255,255,0.03)'
  if (intensity < 0.25) return `rgba(59,130,246,${0.15 + intensity * 0.6})`   // blue → cool
  if (intensity < 0.5)  return `rgba(234,179,8,${0.2  + intensity * 0.6})`    // yellow
  if (intensity < 0.75) return `rgba(249,115,22,${0.25 + intensity * 0.5})`   // orange
  return `rgba(239,68,68,${0.35 + intensity * 0.45})`                         // red → hot
}

function intensityLabel(intensity: number): string {
  if (intensity === 0)   return 'No activity'
  if (intensity < 0.25)  return 'Low'
  if (intensity < 0.5)   return 'Moderate'
  if (intensity < 0.75)  return 'High'
  return 'Very High'
}

export default function HeatmapView({ cells, title = 'Zone Activity Heatmap' }: HeatmapViewProps) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <LucideThermometer className="text-orange-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-outfit font-semibold">{title}</h3>
            <p className="text-xs text-zinc-400">24-hour seat activity intensity</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        <span>Cold</span>
        <div className="flex-grow h-2 rounded-full" style={{
          background: 'linear-gradient(to right, rgba(59,130,246,0.3), rgba(234,179,8,0.5), rgba(249,115,22,0.6), rgba(239,68,68,0.8))'
        }} />
        <span>Hot</span>
      </div>

      {/* Heatmap Grid */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/5"
        style={{ paddingBottom: '60%', background: 'rgba(255,255,255,0.02)' }}>
        {cells.map((cell, i) => (
          <motion.div
            key={cell.seat_id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.4 }}
            className="absolute group"
            style={{
              left:   `${cell.x_min * 100}%`,
              top:    `${cell.y_min * 100}%`,
              width:  `${(cell.x_max - cell.x_min) * 100}%`,
              height: `${(cell.y_max - cell.y_min) * 100}%`,
              padding: '4px',
            }}
          >
            <div
              className="w-full h-full rounded-xl flex items-center justify-center relative transition-all duration-300 hover:scale-95 hover:opacity-90 cursor-pointer"
              style={{ background: intensityToColor(cell.intensity) }}
            >
              <div className="text-center">
                <span className="text-[9px] font-bold text-white/70 block">{cell.seat_name}</span>
                {cell.intensity > 0 && (
                  <span className="text-[8px] text-white/50">{cell.activity_count}</span>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity
                bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] whitespace-nowrap z-50 shadow-2xl">
                <span className="font-bold text-white">{cell.seat_name}</span>
                <span className="text-zinc-400 ml-2">{intensityLabel(cell.intensity)}</span>
                <span className="text-zinc-500 ml-2">({cell.activity_count} events)</span>
              </div>
            </div>
          </motion.div>
        ))}

        {cells.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
            No activity data available for this period
          </div>
        )}
      </div>
    </div>
  )
}
