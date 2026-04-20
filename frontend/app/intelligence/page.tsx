'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LucideBrain, LucideRefreshCw, LucideLoader2 } from 'lucide-react'
import AlertsPanel from '@/components/AlertsPanel'
import InsightsPanel from '@/components/InsightsPanel'
import HeatmapView from '@/components/HeatmapView'
import ScoresPanel from '@/components/ScoresPanel'
import { getIntelSummary } from '@/lib/api'

// ── Mock data for offline / demo mode ──────────────────────────────
const mockInsights = {
  top_active_seat:    { insight: 'Seat S6 is the most active today with 42 occupancy events.', value: 42, seat_name: 'S6' },
  least_active_zone:  { insight: "Zone 'CCTV-01' has the lowest activity today (12 events across 16 seats).", value: 12, camera_name: 'CCTV-01' },
  peak_activity_time: { insight: 'Peak workspace activity occurs between 14:00 – 14:59 (87 events this week).', hour: 14, label: '14:00 – 14:59', value: 87 },
  productivity_leader:{ insight: "Seat 'S9' leads productivity with a score of 78/100 (Grade: B).", score: 78, grade: 'B', seat_name: 'S9' },
  camera_health:      { insight: 'Camera network is healthy: 1/1 cameras online (100% uptime).', health_pct: 100, status: 'healthy', total: 1, online: 1 },
}
const mockAlerts = [
  { alert_id: 'cam-never-1', type: 'camera_offline', severity: 'critical' as const, camera_name: 'CCTV-01', message: "Camera 'CCTV-01' has never sent a heartbeat. Stream may be offline.", timestamp: new Date().toISOString() },
  { alert_id: 'idle-3', type: 'seat_idle', severity: 'medium' as const, seat_name: 'S3', message: "Seat 'S3' has been idle for 142 min during work hours.", idle_minutes: 142, timestamp: new Date().toISOString() },
  { alert_id: 'pattern-7', type: 'irregular_pattern', severity: 'low' as const, message: 'Seat 7 shows inconsistent usage (CoV: 0.82).', timestamp: new Date().toISOString() },
]
const mockHeatmap = Array.from({ length: 16 }, (_, i) => ({
  seat_id: i + 1,
  seat_name: `S${i + 1}`,
  x_min: (i % 4) * 0.25,
  y_min: Math.floor(i / 4) * 0.25,
  x_max: (i % 4 + 1) * 0.25,
  y_max: (Math.floor(i / 4) + 1) * 0.25,
  intensity: Math.random(),
  activity_count: Math.floor(Math.random() * 60),
}))
const mockScores = [
  { seat_id: 9, seat_name: 'S9', score: 78, grade: 'B', breakdown: { time_score: 38, consistency_score: 24, break_score: 16, active_minutes_7d: 1920 } },
  { seat_id: 6, seat_name: 'S6', score: 71, grade: 'B', breakdown: { time_score: 34, consistency_score: 22, break_score: 15, active_minutes_7d: 1710 } },
  { seat_id: 1, seat_name: 'S1', score: 65, grade: 'B', breakdown: { time_score: 30, consistency_score: 21, break_score: 14, active_minutes_7d: 1510 } },
  { seat_id: 13, seat_name: 'S13', score: 52, grade: 'C', breakdown: { time_score: 25, consistency_score: 15, break_score: 12, active_minutes_7d: 1250 } },
  { seat_id: 3, seat_name: 'S3', score: 43, grade: 'C', breakdown: { time_score: 20, consistency_score: 14, break_score: 9, active_minutes_7d: 1010 } },
  { seat_id: 16, seat_name: 'S16', score: 38, grade: 'D', breakdown: { time_score: 18, consistency_score: 12, break_score: 8, active_minutes_7d: 910 } },
  { seat_id: 2, seat_name: 'S2', score: 0, grade: 'N/A', breakdown: { time_score: 0, consistency_score: 0, break_score: 0, active_minutes_7d: 0 } },
  { seat_id: 4, seat_name: 'S4', score: 0, grade: 'N/A', breakdown: { time_score: 0, consistency_score: 0, break_score: 0, active_minutes_7d: 0 } },
]

export default function IntelligencePage() {
  const [insights, setInsights] = useState<any>(mockInsights)
  const [alerts, setAlerts] = useState<any[]>(mockAlerts)
  const [heatmap, setHeatmap] = useState<any[]>(mockHeatmap)
  const [scores, setScores] = useState<any[]>(mockScores)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  async function fetchIntelligence() {
    try {
      setLoading(true)
      const res = await getIntelSummary()
      const d = res.data
      if (d.insights) setInsights(d.insights)
      if (d.alerts?.length >= 0) setAlerts(d.alerts)
      if (d.heatmap?.length > 0) setHeatmap(d.heatmap)
      if (d.productivity_scores?.length > 0) setScores(d.productivity_scores)
      setLastUpdated(d.generated_at || new Date().toISOString())
      setIsLive(true)
    } catch {
      console.warn('Intelligence API unavailable — using demo data.')
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntelligence()
    const interval = setInterval(fetchIntelligence, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {/* Intelligence Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="surface-3d p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 rounded-2xl shadow-lg shadow-indigo-500/10">
            <LucideBrain className="text-indigo-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-bold tracking-tight">
              Intelligence Engine
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                isLive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 animate-pulse'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
              }`}>
                {isLive ? 'LIVE DATA' : 'DEMO MODE'}
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-zinc-500">
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="panel-depth rounded-2xl px-4 py-3 min-w-[180px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Engine State</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`status-pulse ${loading ? 'bg-amber-500' : isLive ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              <span className="text-sm font-medium">{loading ? 'Refreshing' : isLive ? 'Inference live' : 'Demo simulation'}</span>
            </div>
          </div>
          <button
            onClick={fetchIntelligence}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <LucideLoader2 size={16} className="animate-spin" />
            ) : (
              <LucideRefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <InsightsPanel data={insights} />
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <HeatmapView cells={heatmap} />
          <ScoresPanel scores={scores} />
        </div>
      </div>
    </div>
  )
}
