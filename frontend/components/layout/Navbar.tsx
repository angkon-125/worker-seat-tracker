"use client";
import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Search, 
  HelpCircle, 
  Command,
  Activity,
  Wifi,
  Clock as ClockIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 h-20 border-b border-white/[0.03] backdrop-blur-xl bg-black/40 z-40 px-8 flex items-center justify-between">
      {/* Left Section: Search / Global Status */}
      <div className="flex items-center gap-8 flex-1">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group w-full max-w-md hidden lg:block"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search telemetry or nodes..."
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 pointer-events-none">
            <Command size={10} className="text-white/20" />
            <span className="text-[10px] font-black text-white/20 uppercase">K</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
           <div className="h-6 w-[1px] bg-white/[0.05]" />
           <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-white/40">
                       {i}
                    </div>
                 ))}
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hidden xl:block">Nodes Active</p>
           </div>
        </div>
      </div>

      {/* Right Section: System Metrics */}
      <div className="flex items-center gap-6">
        {/* System Health */}
        <div className="hidden sm:flex items-center gap-6 px-6 border-r border-white/[0.05]">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">System Health</span>
               <motion.span 
                 animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
               />
            </div>
            <p className="text-xs font-bold text-white/80">Optimal Status</p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Global Sync</span>
               <Wifi size={10} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-white/80 tabular-nums">42ms Latency</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-white/40">
              <ClockIcon size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Standard Time</span>
            </div>
            <span className="text-sm font-bold text-white tabular-nums tracking-tighter">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-zinc-950" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white/[0.1] border border-white/10 flex items-center justify-center font-bold text-white text-xs cursor-pointer hover:border-blue-500/50 transition-colors">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
