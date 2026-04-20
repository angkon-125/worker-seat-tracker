'use client'

import { motion } from 'framer-motion'
import { LucideMoreVertical } from 'lucide-react'
import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend: string
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, rotateX: -4, rotateY: 4 }}
      className="glass-card surface-3d p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="panel-depth p-3 rounded-xl transition-colors">
          {icon}
        </div>
        <LucideMoreVertical className="text-zinc-600 size-5 cursor-pointer hover:text-white transition-colors" />
      </div>
      <div>
        <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
        <h4 className="text-3xl font-outfit font-bold mb-2">{value}</h4>
        <p className="text-xs text-zinc-500 font-medium">{trend}</p>
      </div>
    </motion.div>
  )
}
