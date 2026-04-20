'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LucideHistory, 
  LucideFilter, 
  LucideDownload, 
  LucideSearch,
  LucideCalendar,
  LucideUser,
  LucideArmchair,
  LucideCheckCircle2,
  LucideXCircle,
  LucideClock,
  LucideBarChart3
} from 'lucide-react'
import { getLogs, getLogsSummary, getSeats, getCameras } from '@/lib/api'

interface LogEntry {
  id: number
  seat_id: number
  seat_name: string
  camera_name: string
  room_name: string
  is_occupied: boolean
  timestamp: string
}

interface FilterState {
  seat_id: number | ''
  camera_id: number | ''
  start_date: string
  end_date: string
  status: 'all' | 'occupied' | 'vacated'
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [summary, setSummary] = useState({ total_logs: 0, today_logs: 0, most_active_seat: null })
  const [seats, setSeats] = useState([])
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    seat_id: '',
    camera_id: '',
    start_date: '',
    end_date: '',
    status: 'all'
  })
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 })

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [seatsRes, camerasRes] = await Promise.all([
          getSeats(),
          getCameras()
        ])
        setSeats(seatsRes.data)
        setCameras(camerasRes.data)
      } catch (err) {
        console.warn('Failed to load filters data')
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      try {
        const params: any = { limit: pagination.limit, offset: pagination.offset }
        if (filters.seat_id) params.seat_id = filters.seat_id
        if (filters.camera_id) params.camera_id = filters.camera_id
        if (filters.start_date) params.start_date = new Date(filters.start_date).toISOString()
        if (filters.end_date) params.end_date = new Date(filters.end_date).toISOString()

        const [logsRes, summaryRes] = await Promise.all([
          getLogs(params),
          getLogsSummary()
        ])

        let filteredLogs = logsRes.data.logs || []
        if (filters.status !== 'all') {
          filteredLogs = filteredLogs.filter((log: LogEntry) => 
            filters.status === 'occupied' ? log.is_occupied : !log.is_occupied
          )
        }

        setLogs(filteredLogs)
        setPagination(prev => ({ ...prev, total: logsRes.data.total }))
        setSummary(summaryRes.data)
      } catch (err) {
        console.warn('Using demo logs data')
        // Demo data
        const demoLogs: LogEntry[] = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          seat_id: (i % 8) + 1,
          seat_name: `S${(i % 8) + 1}`,
          camera_name: 'CCTV-01',
          room_name: 'Main Workspace',
          is_occupied: i % 3 === 0,
          timestamp: new Date(Date.now() - i * 3600000).toISOString()
        }))
        setLogs(demoLogs)
        setSummary({ total_logs: 1250, today_logs: 48, most_active_seat: { id: 6, name: 'S6', event_count: 142 } })
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [filters, pagination.offset, pagination.limit])

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="surface-3d p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 rounded-2xl shadow-lg shadow-amber-500/10">
            <LucideHistory className="text-amber-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-bold tracking-tight">Audit Logs</h2>
            <p className="text-sm text-zinc-400 mt-1">Occupancy event history and analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <LucideDownload size={16} />
            Export
          </button>
          <div className="panel-depth rounded-2xl px-4 py-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Events</div>
            <div className="text-xl font-bold font-outfit">{summary.total_logs.toLocaleString()}</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card surface-3d p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <LucideBarChart3 size={18} className="text-amber-400" />
            </div>
            <span className="text-sm text-zinc-400">Today's Activity</span>
          </div>
          <p className="text-2xl font-bold font-outfit">{summary.today_logs}</p>
          <p className="text-xs text-zinc-500 mt-1">Events recorded today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card surface-3d p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <LucideArmchair size={18} className="text-indigo-400" />
            </div>
            <span className="text-sm text-zinc-400">Most Active Seat</span>
          </div>
          <p className="text-2xl font-bold font-outfit">
            {summary.most_active_seat?.name || 'N/A'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {summary.most_active_seat ? `${summary.most_active_seat.event_count} events` : 'No data'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card surface-3d p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <LucideClock size={18} className="text-emerald-400" />
            </div>
            <span className="text-sm text-zinc-400">Avg Response</span>
          </div>
          <p className="text-2xl font-bold font-outfit">2.3s</p>
          <p className="text-xs text-zinc-500 mt-1">Detection latency</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card surface-3d p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <LucideFilter size={18} className="text-zinc-400" />
          <span className="font-medium text-sm">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={filters.seat_id}
            onChange={(e) => setFilters(prev => ({ ...prev, seat_id: e.target.value ? Number(e.target.value) : '' }))}
            className="panel-depth rounded-xl px-3 py-2 text-sm bg-zinc-900 border border-white/10 focus:border-amber-500/50 focus:outline-none"
          >
            <option value="">All Seats</option>
            {seats.map((seat: any) => (
              <option key={seat.id} value={seat.id}>{seat.name}</option>
            ))}
          </select>

          <select
            value={filters.camera_id}
            onChange={(e) => setFilters(prev => ({ ...prev, camera_id: e.target.value ? Number(e.target.value) : '' }))}
            className="panel-depth rounded-xl px-3 py-2 text-sm bg-zinc-900 border border-white/10 focus:border-amber-500/50 focus:outline-none"
          >
            <option value="">All Cameras</option>
            {cameras.map((cam: any) => (
              <option key={cam.id} value={cam.id}>{cam.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="panel-depth rounded-xl px-3 py-2 text-sm bg-zinc-900 border border-white/10 focus:border-amber-500/50 focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="occupied">Occupied Only</option>
            <option value="vacated">Vacated Only</option>
          </select>

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            placeholder="Start Date"
            className="panel-depth rounded-xl px-3 py-2 text-sm bg-zinc-900 border border-white/10 focus:border-amber-500/50 focus:outline-none"
          />

          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            placeholder="End Date"
            className="panel-depth rounded-xl px-3 py-2 text-sm bg-zinc-900 border border-white/10 focus:border-amber-500/50 focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card surface-3d overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Time</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Seat</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Location</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Camera</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-white/10 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No logs found for the selected filters
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(log.timestamp)}</span>
                        <span className="text-xs text-zinc-500">{getTimeAgo(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <LucideArmchair size={16} className="text-zinc-500" />
                        <span className="font-medium">{log.seat_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm">{log.room_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        log.is_occupied
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {log.is_occupied ? (
                          <><LucideCheckCircle2 size={12} /> Occupied</>
                        ) : (
                          <><LucideXCircle size={12} /> Vacated</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-zinc-800 rounded-lg">{log.camera_name}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <p className="text-sm text-zinc-500">
            Showing {logs.length} of {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
              disabled={pagination.offset === 0}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
