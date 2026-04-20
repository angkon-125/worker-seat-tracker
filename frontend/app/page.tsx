'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LucideUsers, LucideCheckCircle, LucideTimer, LucideTrendingUp, LucideMoreVertical } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: '08:00', occupancy: 40 },
  { name: '10:00', occupancy: 85 },
  { name: '12:00', occupancy: 75 },
  { name: '14:00', occupancy: 92 },
  { name: '16:00', occupancy: 60 },
  { name: '18:00', occupancy: 30 },
]

import StatCard from '@/components/StatCard'
import { getStats, getSeats } from '@/lib/api'
import { mockSeats } from '@/lib/mock_data'
import OccupancyGrid from '@/components/OccupancyGrid'

export default function Dashboard() {
  const [statsData, setStatsData] = useState({
    total: 48,
    active: 32,
    attendance: '67%',
    avgSession: '4.2h'
  })
  
  const [seats, setSeats] = useState(mockSeats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, seatsRes] = await Promise.all([
          getStats(),
          getSeats()
        ])
        // If data exists, update states. Otherwise keep mocks for the demo.
        if (statsRes.data.length > 0) {
          const mainRoom = statsRes.data[0]
          setStatsData(prev => ({
            ...prev,
            total: mainRoom.total_seats,
            active: mainRoom.occupied_seats,
            attendance: `${Math.round(mainRoom.occupancy_rate)}%`
          }))
        }
        if (seatsRes.data.length > 0) {
          setSeats(seatsRes.data)
        }
      } catch (err) {
        console.warn("Backend not available, using mock data for demo.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-card surface-3d p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/80 mb-2">Live Spatial Overview</p>
          <h2 className="text-3xl font-outfit font-bold">Workforce Occupancy Command Deck</h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
            Real-time seat telemetry with layered depth styling and persistent data fallback.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="panel-depth rounded-2xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Data State</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`status-pulse ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-sm font-medium">{loading ? 'Syncing live metrics' : 'Live snapshot ready'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Seats" 
          value={statsData.total} 
          icon={<LucideUsers className="text-indigo-500" />} 
          trend="+12% from month" 
        />
        <StatCard 
          title="Active Now" 
          value={statsData.active} 
          icon={<LucideCheckCircle className="text-emerald-500" />} 
          trend="Real-time data" 
        />
        <StatCard 
          title="Attendance" 
          value={statsData.attendance} 
          icon={<LucideTrendingUp className="text-amber-500" />} 
          trend="Target: 75%" 
        />
        <StatCard 
          title="Avg Session" 
          value={statsData.avgSession} 
          icon={<LucideTimer className="text-rose-500" />} 
          trend="-5m vs yesterday" 
        />
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Grid Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <OccupancyGrid seats={seats} title="Main Workspace Live Occupancy" />
          
          {/* Occupancy Chart */}
          <div className="glass-card surface-3d p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-outfit font-semibold">Occupancy Trends</h3>
                <p className="text-sm text-zinc-400">Daily historical occupancy analysis</p>
              </div>
              <LucideMoreVertical className="text-zinc-500 cursor-pointer" />
            </div>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#6366f1' }}
                  />
                  <Area type="monotone" dataKey="occupancy" stroke="#6366f1" fillOpacity={1} fill="url(#colorOcc)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Live Status Summary */}
        <div className="glass-card surface-3d p-6 flex flex-col gap-6 h-fit sticky top-28">
          <h3 className="text-xl font-outfit font-semibold">Live Room Status</h3>
          <div className="flex flex-col gap-4">
            <RoomStatusItem name="Conference Room A" occupied={5} total={8} />
            <RoomStatusItem name="Open Workspace B" occupied={22} total={30} />
            <RoomStatusItem name="Executive Suite" occupied={2} total={5} />
            <RoomStatusItem name="Lounge Area" occupied={3} total={5} />
          </div>
          <button className="btn-primary w-full mt-auto">Manage Zones</button>
        </div>
      </div>
    </div>
  )
}

function RoomStatusItem({ name, occupied, total }: { name: string, occupied: number, total: number }) {
  const percentage = (occupied / total) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm font-medium">
        <span>{name}</span>
        <span className="text-zinc-400">{occupied}/{total}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${percentage > 85 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
        />
      </div>
    </div>
  )
}
