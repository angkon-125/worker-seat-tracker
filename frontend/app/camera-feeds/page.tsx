'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LucideVideo, 
  LucidePlay, 
  LucideSquare, 
  LucideRefreshCw, 
  LucideActivity,
  LucideWifi,
  LucideWifiOff,
  LucideAlertTriangle,
  LucideCamera,
  LucideSettings2
} from 'lucide-react'
import { getCameras, startCamera, stopCamera } from '@/lib/api'

interface Camera {
  id: number
  name: string
  rtsp_url: string
  is_active: boolean
  last_heartbeat: string | null
  room_name?: string
  seats_count?: number
}

export default function CameraFeedsPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    async function fetchCameras() {
      try {
        const res = await getCameras()
        const cams = res.data.map((cam: any) => ({
          ...cam,
          room_name: cam.room?.name || 'Unknown',
          seats_count: cam.seats?.length || 0
        }))
        setCameras(cams)
        if (cams.length > 0 && !selectedCamera) {
          setSelectedCamera(cams[0])
        }
      } catch (err) {
        console.warn('Using demo camera data')
        const demoCameras: Camera[] = [
          {
            id: 1,
            name: 'CCTV-01 - Main Floor',
            rtsp_url: 'rtsp://192.168.1.101:554/stream1',
            is_active: true,
            last_heartbeat: new Date().toISOString(),
            room_name: 'Main Workspace',
            seats_count: 16
          },
          {
            id: 2,
            name: 'CCTV-02 - Conference',
            rtsp_url: 'rtsp://192.168.1.102:554/stream1',
            is_active: false,
            last_heartbeat: null,
            room_name: 'Conference Room A',
            seats_count: 8
          }
        ]
        setCameras(demoCameras)
        setSelectedCamera(demoCameras[0])
      } finally {
        setLoading(false)
      }
    }
    
    fetchCameras()
    const interval = setInterval(fetchCameras, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStartCamera = async (cameraId: number) => {
    setActionLoading(cameraId)
    try {
      await startCamera(cameraId)
      setCameras(prev => prev.map(cam => 
        cam.id === cameraId ? { ...cam, is_active: true } : cam
      ))
    } catch (err) {
      console.error('Failed to start camera:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStopCamera = async (cameraId: number) => {
    setActionLoading(cameraId)
    try {
      await stopCamera(cameraId)
      setCameras(prev => prev.map(cam => 
        cam.id === cameraId ? { ...cam, is_active: false } : cam
      ))
    } catch (err) {
      console.error('Failed to stop camera:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const activeCount = cameras.filter(c => c.is_active).length
  const inactiveCount = cameras.filter(c => !c.is_active).length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="surface-3d p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 rounded-2xl shadow-lg shadow-blue-500/10">
            <LucideVideo className="text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-bold tracking-tight">Camera Feeds</h2>
            <p className="text-sm text-zinc-400 mt-1">RTSP stream management and monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="panel-depth rounded-2xl px-4 py-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400">{activeCount} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-zinc-400">{inactiveCount} Offline</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <LucideRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cameras.map((camera, index) => (
          <motion.div
            key={camera.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card surface-3d p-6 ${selectedCamera?.id === camera.id ? 'border-blue-500/30' : ''}`}
            onClick={() => setSelectedCamera(camera)}
          >
            {/* Camera Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${camera.is_active ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  <LucideCamera size={20} className={camera.is_active ? 'text-emerald-400' : 'text-rose-400'} />
                </div>
                <div>
                  <h3 className="font-semibold">{camera.name}</h3>
                  <p className="text-xs text-zinc-500">{camera.room_name}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold ${
                camera.is_active 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
              }`}>
                {camera.is_active ? 'Streaming' : 'Offline'}
              </div>
            </div>

            {/* Video Feed Placeholder */}
            <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden mb-4 border border-white/5">
              {camera.is_active ? (
                <>
                  {/* Simulated Live Feed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <LucideActivity size={48} className="text-emerald-500/50 mx-auto mb-2" />
                        <p className="text-zinc-500 text-sm">Live Feed Active</p>
                        <p className="text-zinc-600 text-xs mt-1">YOLOv8 Detection Running</p>
                      </div>
                    </div>
                    {/* Overlay Stats */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-300">REC</span>
                      </div>
                      <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                        <span className="text-[10px] text-zinc-300">{camera.seats_count} Seats Monitored</span>
                      </div>
                    </div>
                    {/* Timestamp */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                      <span className="text-[10px] text-zinc-300 font-mono">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <LucideWifiOff size={48} className="text-rose-500/50 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">Stream Offline</p>
                    <p className="text-zinc-600 text-xs mt-1">{camera.rtsp_url}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Info & Controls */}
            <div className="flex justify-between items-center">
              <div className="text-xs text-zinc-500">
                <p>RTSP: {camera.rtsp_url.replace('rtsp://', '').split('/')[0]}</p>
                {camera.last_heartbeat && (
                  <p className="mt-1">
                    Last seen: {new Date(camera.last_heartbeat).toLocaleTimeString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {camera.is_active ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStopCamera(camera.id); }}
                    disabled={actionLoading === camera.id}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl transition-colors text-sm font-medium border border-rose-500/30"
                  >
                    {actionLoading === camera.id ? (
                      <LucideRefreshCw size={16} className="animate-spin" />
                    ) : (
                      <LucideSquare size={16} />
                    )}
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartCamera(camera.id); }}
                    disabled={actionLoading === camera.id}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors text-sm font-medium border border-emerald-500/30"
                  >
                    {actionLoading === camera.id ? (
                      <LucideRefreshCw size={16} className="animate-spin" />
                    ) : (
                      <LucidePlay size={16} />
                    )}
                    Start
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Camera Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card surface-3d p-6 border-dashed border-2 border-white/10 hover:border-white/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-center gap-3 text-zinc-500">
          <LucideCamera size={24} />
          <span className="font-medium">Add New Camera Feed</span>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg">Coming Soon</span>
        </div>
      </motion.div>
    </div>
  )
}
