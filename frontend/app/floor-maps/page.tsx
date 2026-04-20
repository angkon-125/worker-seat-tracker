'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LucideMap, LucideLayers, LucideMaximize2, LucideInfo, LucideUsers, LucideVideo } from 'lucide-react'
import { getFloorMapData, getSeats, getStats } from '@/lib/api'

interface Seat {
  id: number
  name: string
  x_min: number
  y_min: number
  x_max: number
  y_max: number
  is_occupied: boolean
}

interface Camera {
  id: number
  name: string
  seats: Seat[]
}

interface Room {
  id: number
  name: string
  description: string
  cameras: Camera[]
}

export default function FloorMapsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        const [roomsRes, seatsRes] = await Promise.all([
          getFloorMapData(),
          getSeats()
        ])
        
        // Merge seat data with rooms
        const apiSeats: Seat[] = seatsRes.data
        const seatsMap = new Map<number, Seat>(apiSeats.map((s) => [s.id, s]))
        
        const apiRooms: Room[] = roomsRes.data
        const enrichedRooms = apiRooms.map((room) => ({
          ...room,
          cameras: room.cameras.map((cam) => ({
            ...cam,
            seats: cam.seats.map((seat) => {
              const seatData = seatsMap.get(seat.id)
              return seatData ? { ...seat, ...seatData } : seat
            })
          }))
        }))
        
        setRooms(enrichedRooms)
        if (enrichedRooms.length > 0) {
          setSelectedRoom(enrichedRooms[0])
        }
      } catch (err) {
        console.warn('Using demo data for floor maps')
        // Demo data fallback
        const demoRoom: Room = {
          id: 1,
          name: 'Main Workspace',
          description: 'Open floor plan with 16 workstations',
          cameras: [{
            id: 1,
            name: 'CCTV-01',
            seats: Array.from({ length: 16 }, (_, i) => ({
              id: i + 1,
              name: `S${i + 1}`,
              x_min: (i % 4) * 0.25 + 0.02,
              y_min: Math.floor(i / 4) * 0.25 + 0.02,
              x_max: (i % 4 + 1) * 0.25 - 0.02,
              y_max: (Math.floor(i / 4) + 1) * 0.25 - 0.02,
              is_occupied: [0, 2, 5, 8, 12, 15].includes(i)
            }))
          }]
        }
        setRooms([demoRoom])
        setSelectedRoom(demoRoom)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const totalSeats = selectedRoom?.cameras.reduce((acc, cam) => acc + cam.seats.length, 0) || 0
  const occupiedSeats = selectedRoom?.cameras.reduce(
    (acc, cam) => acc + cam.seats.filter(s => s.is_occupied).length, 
    0
  ) || 0

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="surface-3d p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 rounded-2xl shadow-lg shadow-emerald-500/10">
            <LucideMap className="text-emerald-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-bold tracking-tight">Floor Maps</h2>
            <p className="text-sm text-zinc-400 mt-1">Visual workspace layout with real-time occupancy</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rooms.length > 1 && (
            <select
              value={selectedRoom?.id}
              onChange={(e) => {
                const room = rooms.find(r => r.id === Number(e.target.value))
                setSelectedRoom(room || null)
              }}
              className="panel-depth rounded-xl px-4 py-2 text-sm bg-zinc-900 border border-white/10 focus:border-emerald-500/50 focus:outline-none"
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          )}
          <div className="panel-depth rounded-2xl px-4 py-3">
            <div className="flex items-center gap-4 text-sm">
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
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Seats" value={totalSeats} icon={<LucideLayers size={20} className="text-emerald-400" />} />
        <StatCard title="Occupied" value={occupiedSeats} icon={<LucideUsers size={20} className="text-rose-400" />} />
        <StatCard title="Available" value={totalSeats - occupiedSeats} icon={<LucideMaximize2 size={20} className="text-emerald-400" />} />
        <StatCard title="Cameras" value={selectedRoom?.cameras.length || 0} icon={<LucideVideo size={20} className="text-indigo-400" />} />
      </div>

      {/* Floor Map Visualization */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card surface-3d p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-outfit font-semibold">{selectedRoom?.name || 'Loading...'}</h3>
            <p className="text-sm text-zinc-400">{selectedRoom?.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-outfit">
              {totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0}%
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Occupancy Rate</p>
          </div>
        </div>

        {/* Interactive Floor Map */}
        <div 
          className="relative w-full aspect-[16/9] bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-white/5 overflow-hidden"
          onMouseMove={handleMouseMove}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }} />
          </div>

          {/* Room Label */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
            <span className="text-xs font-medium text-zinc-300">{selectedRoom?.name}</span>
          </div>

          {/* Seats */}
          {selectedRoom?.cameras.map((camera) =>
            camera.seats.map((seat) => (
              <motion.div
                key={seat.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: seat.id * 0.02 }}
                className={`absolute cursor-pointer transition-all duration-300 ${
                  seat.is_occupied 
                    ? 'bg-rose-500/30 border-rose-500/60 hover:bg-rose-500/50' 
                    : 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/40'
                } border-2 rounded-xl flex items-center justify-center group`}
                style={{
                  left: `${seat.x_min * 100}%`,
                  top: `${seat.y_min * 100}%`,
                  width: `${(seat.x_max - seat.x_min) * 100}%`,
                  height: `${(seat.y_max - seat.y_min) * 100}%`,
                }}
                onMouseEnter={() => setHoveredSeat(seat)}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <span className={`text-xs font-bold ${seat.is_occupied ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {seat.name}
                </span>
                
                {/* Status Indicator */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${seat.is_occupied ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              </motion.div>
            ))
          )}

          {/* Legend/Instructions */}
          <div className="absolute bottom-4 right-4 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-zinc-500">
            Hover over seats for details
          </div>
        </div>
      </motion.div>

      {/* Seat Detail Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {selectedRoom?.cameras.flatMap(cam => cam.seats).map((seat) => (
          <motion.div
            key={seat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: seat.id * 0.03 }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              seat.is_occupied
                ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{seat.name}</span>
              <div className={`w-2 h-2 rounded-full ${seat.is_occupied ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </div>
            <p className={`text-[10px] uppercase tracking-wider ${seat.is_occupied ? 'text-rose-400' : 'text-emerald-400'}`}>
              {seat.is_occupied ? 'Occupied' : 'Available'}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredSeat && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-50 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl pointer-events-none"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${hoveredSeat.is_occupied ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="font-bold">{hoveredSeat.name}</span>
          </div>
          <p className={`text-xs ${hoveredSeat.is_occupied ? 'text-rose-400' : 'text-emerald-400'}`}>
            {hoveredSeat.is_occupied ? 'Currently Occupied' : 'Available'}
          </p>
        </motion.div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass-card surface-3d p-4 flex items-center gap-4">
      <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold font-outfit">{value}</p>
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  )
}
