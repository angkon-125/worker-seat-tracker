"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Video, 
  Activity, 
  Maximize2, 
  Settings2,
  Cpu,
  RefreshCw,
  Play,
  Square,
  Zap,
  ShieldCheck,
  WifiOff,
  Wifi
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCameras, getCameraWorkerStatus, startCameraStream, stopCameraStream } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export default function CamerasPage() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [workerStatus, setWorkerStatus] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [cameraData, statusData] = await Promise.all([
        getCameras(),
        getCameraWorkerStatus().catch(() => ({ workers: {} })),
      ]);
      setCameras(cameraData);
      // Build a flat map: camera_id → status
      const statusMap: Record<number, string> = {};
      Object.values(statusData.workers || {}).forEach((w: any) => {
        statusMap[w.camera_id] = w.status;
      });
      setWorkerStatus(statusMap);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cameras:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggleStream = async (cameraId: number, isRunning: boolean) => {
    try {
      if (isRunning) {
        await stopCameraStream(cameraId);
      } else {
        await startCameraStream(cameraId);
      }
      // Refresh status immediately after toggle
      setTimeout(fetchData, 500);
    } catch (error: any) {
      console.error("Stream control error:", error?.response?.data?.detail || error.message);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-12 pb-20"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full glow-blue" />
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Neural Surveillance</h2>
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">Vision Network</h1>
          <p className="text-white/30 text-sm font-medium">Real-time RTSP stream management and AI orchestration.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Live worker count badge */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl backdrop-blur-md">
            <Cpu size={16} className="text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active Workers</span>
              <span className="text-sm font-black text-white">
                {Object.keys(workerStatus).length} / 2
              </span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all"
          >
            <RefreshCw size={16} />
            Re-Sync
          </motion.button>
        </div>
      </motion.div>

      {/* Camera Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-[2rem] skeleton-shimmer" />
            ))}
          </motion.div>
        ) : (
          <motion.div 
             key="content"
             className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            {cameras.map((camera, i) => (
              <CameraNode
                key={camera.id}
                camera={camera}
                index={i}
                workerStatus={workerStatus[camera.id] || "stopped"}
                onToggleStream={handleToggleStream}
              />
            ))}
            
            {cameras.length === 0 && (
              <motion.div 
                 variants={itemVariants}
                 className="lg:col-span-2 py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center group transition-colors hover:bg-white/[0.02]"
              >
                 <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mb-8 border border-white/5">
                    <Video size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-white/40 tracking-tight">No Cameras Registered</h3>
                 <p className="text-xs text-white/20 mt-2 uppercase tracking-[0.3em] font-black">Register RTSP streams to enable spatial awareness</p>
                 <button 
                   onClick={fetchData}
                   className="mt-10 flex items-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                    <RefreshCw size={14} />
                    Re-Sync Network
                 </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface CameraNodeProps {
  camera: any;
  index: number;
  workerStatus: string;
  onToggleStream: (id: number, isRunning: boolean) => void;
}

function CameraNode({ camera, index, workerStatus, onToggleStream }: CameraNodeProps) {
  const [toggling, setToggling] = useState(false);
  const isRunning = workerStatus === "running";
  const isError = workerStatus === "error";

  const handleToggle = async () => {
    setToggling(true);
    await onToggleStream(camera.id, isRunning);
    setTimeout(() => setToggling(false), 800);
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -8 }}
      className="glass-card group overflow-hidden border-white/[0.03] rounded-[2rem]"
    >
      {/* Main Stream Area */}
      <div className={cn(
        "aspect-video relative overflow-hidden transition-all duration-700",
        isRunning ? "bg-neutral-950 group-hover:glow-blue" : "bg-black"
      )}>
        {/* Stream Feed Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-[2000ms]">
          {isRunning ? (
            <Activity size={64} className="text-white/[0.03] group-hover:text-blue-500/10 animate-pulse" />
          ) : (
            <WifiOff size={64} className="text-white/[0.03]" />
          )}
        </div>

        {/* REC indicator — only when running */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-5 left-5 flex items-center gap-2"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
            />
            <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">REC LIVE</span>
          </motion.div>
        )}

        {/* Overlay Info */}
        <div className={cn(
          "absolute inset-0 p-8 flex flex-col justify-between transition-all duration-700",
          "bg-gradient-to-t from-black/90 via-transparent to-black/40",
          isRunning && "group-hover:bg-blue-950/20"
        )}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                CAM-{String(camera.id).padStart(2, "0")} // {camera.location || "SECTOR ALPHA"}
              </span>
              <h3 className="text-2xl font-black font-outfit tracking-tighter text-white">{camera.name}</h3>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <Maximize2 size={20} />
            </motion.button>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-3">
              {/* Status pill */}
              <div className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-xl w-fit backdrop-blur-md border text-[10px] font-black uppercase tracking-widest",
                isRunning && "bg-blue-600/10 border-blue-500/20 text-blue-400",
                isError && "bg-red-600/10 border-red-500/20 text-red-400",
                !isRunning && !isError && "bg-white/5 border-white/10 text-white/30"
              )}>
                {isRunning ? <Wifi size={12} /> : isError ? <WifiOff size={12} /> : <Square size={12} />}
                {isRunning ? "Live Processing" : isError ? "Worker Error" : "Stream Idle"}
              </div>

              {/* RTSP URL */}
              <p className="text-[10px] font-mono text-white/20 tracking-[0.1em] group-hover:text-white/40 transition-colors truncate max-w-[280px]">
                {camera.rtsp_url}
              </p>
            </div>

            {/* Stream Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggle}
              disabled={toggling}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                "border shadow-lg",
                isRunning
                  ? "bg-red-600/10 border-red-500/20 text-red-400 hover:bg-red-600/20 shadow-red-500/10"
                  : "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 shadow-emerald-500/10",
                toggling && "opacity-40 cursor-not-allowed"
              )}
            >
              {toggling ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <RefreshCw size={14} />
                </motion.div>
              ) : isRunning ? (
                <><Square size={14} fill="currentColor" /> Stop</>
              ) : (
                <><Play size={14} fill="currentColor" /> Start</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity" style={{
           backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 0)',
           backgroundSize: '32px 32px'
        }} />
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-[0.08] transition-opacity" style={{
           backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%)',
           backgroundSize: '100% 4px'
        }} />
      </div>

      {/* Metadata Row */}
      <div className="p-8 border-t border-white/[0.03] grid grid-cols-3 gap-8 bg-black/20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
             <div className="w-1 h-3 bg-blue-500/20 rounded-full" />
             <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.25em]">Resolution</span>
          </div>
          <span className="text-sm font-bold text-white/70">640 × 360</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
             <div className="w-1 h-3 bg-indigo-500/20 rounded-full" />
             <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.25em]">Frame Skip</span>
          </div>
          <span className="text-sm font-bold text-white/70">1 / 6 frames</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
             <div className="w-1 h-3 bg-emerald-500/20 rounded-full" />
             <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.25em]">AI Model</span>
          </div>
          <div className="flex items-center gap-2">
             <ShieldCheck size={14} className="text-emerald-500/50" />
             <span className="text-sm font-bold text-emerald-500">YOLOv8n</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
