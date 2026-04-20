'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LucideAlertTriangle, LucideAlertCircle, LucideInfo, LucideShieldAlert, LucideBell, LucideX } from 'lucide-react'

interface Alert {
  alert_id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  timestamp: string
  seat_name?: string
  camera_name?: string
  idle_minutes?: number
  minutes_since_heartbeat?: number
}

interface AlertsPanelProps {
  alerts: Alert[]
}

const severityConfig = {
  critical: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300',
    icon: LucideAlertCircle,
    pulse: 'bg-rose-500',
    label: 'CRITICAL',
  },
  high: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300',
    icon: LucideAlertTriangle,
    pulse: 'bg-orange-500',
    label: 'HIGH',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    icon: LucideShieldAlert,
    pulse: 'bg-amber-500',
    label: 'MEDIUM',
  },
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
    icon: LucideInfo,
    pulse: 'bg-blue-500',
    label: 'LOW',
  },
}

const typeLabels: Record<string, string> = {
  seat_idle: 'Idle Seat',
  camera_offline: 'Camera Offline',
  camera_timeout: 'Camera Timeout',
  irregular_pattern: 'Irregular Pattern',
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const highCount = alerts.filter(a => a.severity === 'high').length

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <LucideBell className="text-rose-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-outfit font-semibold">Smart Alerts</h3>
            <p className="text-xs text-zinc-400">{alerts.length} active issues</p>
          </div>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="px-2 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 rounded-lg">
              {criticalCount} CRITICAL
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-1 text-xs font-bold bg-orange-500/20 text-orange-300 rounded-lg">
              {highCount} HIGH
            </span>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-2"
            >
              <LucideBell size={32} />
              <span className="text-sm">All systems operating normally</span>
            </motion.div>
          ) : (
            alerts.map((alert, i) => {
              const config = severityConfig[alert.severity] || severityConfig.low
              const Icon = config.icon
              return (
                <motion.div
                  key={alert.alert_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${config.bg} ${config.border}`}
                >
                  <div className={`mt-0.5 relative flex-shrink-0`}>
                    <Icon className={config.text} size={18} />
                    {alert.severity === 'critical' && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${config.pulse} animate-ping`} />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${config.badge}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                        {typeLabels[alert.type] ?? alert.type}
                      </span>
                    </div>
                    <p className={`text-sm font-medium leading-snug ${config.text}`}>{alert.message}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
