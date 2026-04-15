"use client";

import { useState } from "react";
import { 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  ChevronDown,
  Activity,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";

const workerTimeData = [
  { name: "Alex R.", hours: 38 },
  { name: "Sarah M.", hours: 42 },
  { name: "John D.", hours: 32 },
  { name: "Elena K.", hours: 45 },
  { name: "Mike T.", hours: 28 },
  { name: "Lisa W.", hours: 40 },
];

const occupancyPieData = [
  { name: "Productive", value: 75, color: "#3b82f6" },
  { name: "Empty", value: 15, color: "rgba(255,255,255,0.05)" },
  { name: "Breaks", value: 10, color: "#6366f1" },
];

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
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("Last 7 Days");

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
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Analytics Engine</h2>
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">Telemetric Intelligence</h1>
          <p className="text-white/30 text-sm font-medium">Global utilization vectors and workforce compliance mapping.</p>
        </div>

        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            className="flex items-center gap-3 px-5 py-3.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl cursor-pointer backdrop-blur-md transition-all group"
          >
             <Calendar size={18} className="text-white/30 group-hover:text-blue-500 transition-colors" />
             <span className="text-sm font-bold text-white/80">{dateRange}</span>
             <ChevronDown size={14} className="text-white/20" />
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all"
          >
            <Download size={18} />
            Export Matrix
          </motion.button>
        </div>
      </motion.div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Global Occupancy" 
          value={84.2} 
          icon={<TrendingUp size={20} />} 
          trend={{ value: "5.1%", isUp: true }}
          delay={0.1}
          suffix="%"
        />
        <StatCard 
          title="Matrix Uptime" 
          value={1240} 
          icon={<Clock size={20} />} 
          trend={{ value: "12%", isUp: true }}
          delay={0.2}
          suffix="h"
        />
        <StatCard 
          title="Sync'd Personnel" 
          value={24} 
          icon={<Users size={20} />} 
          delay={0.3}
        />
        <StatCard 
          title="Anomalies" 
          value={3} 
          icon={<AlertCircle size={20} />} 
          trend={{ value: "2", isUp: false, label: "mitigated" }}
          delay={0.4}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Performance Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-8 glass-card p-10 relative overflow-hidden group border-white/[0.03]">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
              <Activity size={24} />
           </div>
           
           <div className="mb-10">
              <h3 className="text-2xl font-bold text-white tracking-tight">Personnel Bandwidth</h3>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] mt-1">Operational Hours // Cycle 07</p>
           </div>
           
           <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workerTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
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
                    cursor={{fill: 'rgba(255,255,255,0.02)', radius: 10}}
                    contentStyle={{ 
                      backgroundColor: 'rgba(5, 5, 5, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '16px', 
                      boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(20px)'
                    }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="hours" radius={[12, 12, 0, 0]} barSize={45}>
                    {workerTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)'} className="hover:fill-blue-500 transition-all duration-500" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-4 glass-card p-10 flex flex-col border-white/[0.03]">
           <div className="mb-12">
              <h3 className="text-2xl font-bold text-white tracking-tight">Phase Allocation</h3>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] mt-1">Resource Distribution</p>
           </div>

           <div className="h-[320px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={occupancyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={115}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {occupancyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(5, 5, 5, 0.9)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: '16px',
                        backdropFilter: 'blur(20px)'
                      }}
                    />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
                 <motion.span 
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.5, duration: 1 }}
                   className="text-4xl font-black text-white tracking-tighter"
                 >
                   75%
                 </motion.span>
                 <span className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em]">Compliance</span>
                 <div className="w-12 h-[1px] bg-blue-500/30 mt-2" />
              </div>
           </div>

           <div className="mt-12 space-y-3">
              {occupancyPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                      <span className="text-xs font-bold text-white/60 tracking-tight group-hover:text-white transition-colors">{item.name}</span>
                   </div>
                   <span className="text-[11px] font-mono font-bold text-white/20 group-hover:text-blue-500 transition-colors uppercase tracking-widest">{item.value}% Vector</span>
                </div>
              ))}
           </div>
           
           <motion.button 
             whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
             className="mt-10 w-full py-4 bg-white/[0.03] border border-white/[0.05] rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all"
           >
              Optimize Allocation
           </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
