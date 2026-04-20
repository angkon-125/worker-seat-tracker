'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LucideUser } from 'lucide-react'

interface Seat {
  id: number
  name: string
  is_occupied: boolean
}

interface OccupancyGridProps {
  seats: Seat[]
  title?: string
}

export default function OccupancyGrid({ seats, title = "Seat Layout" }: OccupancyGridProps) {
  return (
    <div className="glass-card surface-3d p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-outfit font-semibold">{title}</h3>
        <div className="flex gap-4 text-xs font-medium uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-zinc-400">Occupied</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 [perspective:1200px]">
        {seats.map((seat) => (
          <SeatItem key={seat.id} seat={seat} />
        ))}
      </div>
    </div>
  )
}

function SeatItem({ seat }: { seat: Seat }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05, rotateX: -12, rotateY: 10, y: -6 }}
      whileTap={{ scale: 0.95 }}
      className={`surface-3d relative aspect-square rounded-2xl flex items-center justify-center border transition-colors duration-500 group ${
        seat.is_occupied 
        ? 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-500/10' 
        : 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
      }`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex flex-col items-center gap-1" style={{ transform: 'translateZ(18px)' }}>
        <AnimatePresence mode="wait">
          {seat.is_occupied ? (
            <motion.div
              key="occupied"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="text-rose-500"
            >
              <LucideUser size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="w-5 h-5 rounded-full border-2 border-emerald-500/50"
            />
          )}
        </AnimatePresence>
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${
          seat.is_occupied ? 'text-rose-500/70' : 'text-emerald-500/70'
        }`}>
          {seat.name}
        </span>
      </div>

      {/* Popover on hover */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-2xl">
        Seat {seat.name} - {seat.is_occupied ? 'Occupied' : 'Vacant'}
      </div>
    </motion.div>
  )
}
