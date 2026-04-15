"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Activity, 
  Clock, 
  Camera as CameraIcon,
  TrendingUp,
  ChevronRight,
  MoreHorizontal,
  Zap,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStats, getRecentSessions } from "@/lib/api";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const mockTrendData = [
  { time: "9am", val: 30 }, { time: "10am", val: 55 }, { time: "11am", val: 85 },
  { time: "12pm", val: 40 }, { time: "1pm", val: 70 }, { time: "2pm", val: 95 },
  { time: "3pm", val: 80 }, { time: "4pm", val: 65 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, r] = await Promise.all([getStats(), getRecentSessions()]);
        setStats(s);
        setSessions(r);
        setLoading(false);
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-12 pb-20 cinematic-bg min-h-screen"
    >
      {/* Dynamic Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full glow-blue" />
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Intelligence Matrix</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tighter text-white">
            Operational Overview
          </h1>
          <p className="text-white/30 text-sm max-w-md font-medium leading-relaxed">
            Real-time synchronization with vision nodes. Analytics engine processing live workspace telemetry.
          </p>
        </div>

        <div className="flex items-center gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md">
           <div className="px-4 py-2 flex flex-col items-end">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">Security Level</span>
              <span className="text-xs font-bold text-emerald-500 mt-1">Class Alpha</span>
           </div>
           <button className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5">
              <ShieldCheck size={14} />
              Protocol 01
           </button>
        </div>
      </motion.div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Inventory" 
          value={stats?.total_seats || 48} 
          icon={<Users size={20} />} 
          trend={{ value: "+12.4%", isUp: true, label: "Utilization" }}
          delay={0.1}
        />
        <StatCard 
          title="Active Sessions" 
          value={stats?.occupied_seats || 32} 
          icon={<Activity size={20} />} 
          status="online"
          trend={{ value: "4.2%", isUp: true, label: "Live Flow" }}
          delay={0.2}
        />
        <StatCard 
          title="Avg. Occupancy" 
          value="4.5h" 
          icon={<Clock size={20} />} 
          trend={{ value: "0.5h", isUp: false, label: "Threshold" }}
          delay={0.3}
        />
        <StatCard 
          title="Vision Nodes" 
          value={stats?.active_cameras || 4} 
          icon={<CameraIcon size={20} />} 
          status="online"
          delay={0.4}
        />
      </div>

      {/* Central Command View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Advanced Flow Chart */}
        <motion.div variants={itemVariants} className="xl:col-span-8 glass-card p-10 group relative border-white/[0.03]">
          <div className="absolute top-0 right-0 p-8">
             <Zap size={24} className="text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
          </div>

          <div className="flex items-center justify-between mb-12">
            <div className="flex gap-5">
               <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-500 border border-blue-500/10 shadow-inner group-hover:glow-blue transition-all duration-700">
                  <TrendingUp size={28} />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Occupancy Trajectory</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mt-1">Live Telemetry Data // Stream 302</p>
               </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                   <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700'}}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700'}}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(5, 5, 5, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: '16px', 
                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#chartGlow)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live System Logs */}
        <motion.div variants={itemVariants} className="xl:col-span-4 glass-card p-10 flex flex-col border-white/[0.03]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight text-gradient">Activity Matrix</h3>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black mt-1">Live Event Decryption</p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-white/20">
               <Activity size={18} />
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto max-h-[420px] pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {sessions.length > 0 ? sessions.map((session, i) => (
                <motion.div 
                  key={session.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-5 group p-3 rounded-2xl hover:bg-white/[0.02] transition-all cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-600/10 group-hover:border-blue-600/20 transition-all duration-500">
                      <Users size={22} />
                    </div>
                    {session.is_active && (
                      <motion.span 
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-[3px] border-black shadow-[0_0_10px_#2563eb]"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Node {session.seat_id}</h4>
                    <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-1">
                      {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // ZONE ALPHA
                    </p>
                  </div>
                  <StatusBadge status={session.is_active ? "occupied" : "empty"} />
                </motion.div>
              )) : (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="flex flex-col items-center justify-center h-full text-center py-20 opacity-10"
                >
                  <Activity size={64} className="mb-6" />
                  <p className="text-sm font-black uppercase tracking-[0.4em]">Establishing Uplink...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.98 }}
            className="mt-10 group w-full flex items-center justify-center gap-3 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all shadow-lg"
          >
            Access Full Logs
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Vision Neural Grid */}
      <motion.div variants={itemVariants} className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-600 animate-ping opacity-40" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Active Surveillance Nodes</h3>
          </div>
          <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 border-b border-blue-500/20 pb-1">Master Camera View</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[1, 2, 3, 4].map((i) => (
             <CameraSnapshot key={i} id={`XN-${i}02`} label={`Sector 0${i} Alpha`} delay={0.1 * i} />
           ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CameraSnapshot({ id, label, delay }: { id: string, label: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -8 }}
      className="glass-card aspect-video relative group overflow-hidden cursor-pointer border-white/[0.03]"
    >
       <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-[2000ms] ease-out">
          <CameraIcon size={48} className="text-white/[0.03] group-hover:text-blue-500/5 transition-colors" />
       </div>
       
       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 p-5 flex flex-col justify-between opacity-100 group-hover:bg-blue-950/20 transition-all duration-700">
          <div className="flex justify-between items-start">
             <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse glow-red" />
                   <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">REC // {id}</span>
                </div>
                <p className="text-sm font-bold text-white tracking-wide">{label}</p>
             </div>
             <motion.div 
               whileHover={{ rotate: 90 }}
               className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500"
              >
                <Activity size={16} className="text-blue-500" />
             </motion.div>
          </div>
          
          <div className="flex justify-between items-end">
             <div className="flex flex-col gap-1">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-tighter tracking-[0.1em]">4K Ultra-Low Latency</p>
                <div className="flex items-center gap-2">
                   <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="h-full w-1/2 bg-blue-500 shadow-[0_0_8px_#3b82f6]"
                      />
                   </div>
                   <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Signal OK</p>
                </div>
             </div>
             <div className="w-8 h-8 rounded-full border border-white/10 border-t-blue-500 animate-spin opacity-0 group-hover:opacity-100 duration-1000" />
          </div>
       </div>
       
       {/* Cinematic Interlacing Effect */}
       <div className="absolute inset-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" style={{
         backgroundImage: 'linear-gradient(transparent 50%, black 50%), linear-gradient(90deg, transparent 50%, black 50%)',
         backgroundSize: '100% 4px, 4px 100%'
       }} />
    </motion.div>
  );
}
