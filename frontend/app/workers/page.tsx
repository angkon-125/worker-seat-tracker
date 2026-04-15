"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronRight,
  UserPlus,
  Mail,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWorkers } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getWorkers();
        setWorkers(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workers:", error);
      }
    };
    fetchData();
  }, []);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 pb-20"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full glow-blue" />
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Operations Unit</h2>
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">Worker Analytics</h1>
          <p className="text-white/30 text-sm font-medium">Personnel intelligence and session compliance monitoring.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center p-1.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md transition-all hover:bg-white/[0.04]">
              <button 
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  viewMode === "table" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/20 hover:text-white"
                )}
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  viewMode === "grid" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/20 hover:text-white"
                )}
              >
                <LayoutGrid size={18} />
              </button>
           </div>
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="flex items-center gap-3 px-6 py-3.5 bg-white text-black hover:bg-neutral-200 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5"
           >
              <UserPlus size={16} />
              Onboard Agent
           </motion.button>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 bg-white/[0.01] border border-white/[0.05] rounded-3xl backdrop-blur-md transition-all hover:bg-white/[0.02]">
        <div className="flex items-center gap-4 flex-1 px-5">
           <Search size={22} className="text-white/20" />
           <input 
             type="text" 
             placeholder="Search personnel directory or access level..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="bg-transparent border-none outline-none text-sm w-full py-3.5 text-white placeholder:text-white/20 font-medium"
           />
        </div>
        <button className="flex items-center gap-3 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white border border-white/[0.05] rounded-2xl transition-all hover:bg-white/[0.02]">
          <Filter size={14} />
          Refine Matrix
        </button>
      </motion.div>

      {/* Workers Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-3xl skeleton-shimmer" />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key={viewMode}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {viewMode === "table" ? (
               <div className="glass-card overflow-hidden border-white/[0.03]">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Profile</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Telemetry Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Associated Node</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Session Uptime</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {filteredWorkers.map((worker) => (
                          <motion.tr 
                            variants={itemVariants}
                            key={worker.id} 
                            className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-white group-hover:border-blue-500/30 transition-all duration-500">
                                    {worker.name.charAt(0)}
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{worker.name}</span>
                                    <span className="text-[11px] text-white/20 font-bold uppercase tracking-widest">{worker.email || "SYSTEM@VISION.IO"}</span>
                                 </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                               <StatusBadge status={worker.is_active ? "online" : "offline"} className="scale-90 origin-left" />
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                                  <span className="text-sm font-bold text-white/60">
                                     {worker.current_seat || "STANDBY"}
                                  </span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-3 text-xs font-mono font-bold text-white/30">
                                  <Clock size={14} className="text-blue-500/50" />
                                  <span className="tabular-nums group-hover:text-blue-500 transition-colors">04:12:45</span>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <button className="p-3 rounded-xl bg-white/5 text-white/20 hover:text-white transition-all">
                                  <MoreHorizontal size={20} />
                                </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredWorkers.map((worker) => (
                    <motion.div 
                      variants={itemVariants}
                      key={worker.id} 
                      className="glass-card p-8 group relative overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Zap size={16} className="text-blue-500/20" />
                       </div>

                       <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white group-hover:border-blue-500/50 transition-all duration-700 shadow-xl group-hover:glow-blue">
                             {worker.name.charAt(0)}
                          </div>
                          <StatusBadge status={worker.is_active ? "active" : "offline"} />
                       </div>
                       
                       <h3 className="text-xl font-black font-outfit tracking-tighter text-white">{worker.name}</h3>
                       <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 mb-8">{worker.email || "Access Class B"}</p>
                       
                       <div className="space-y-4 pt-6 border-t border-white/[0.03]">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                             <span className="text-white/10 uppercase tracking-widest">Target Sector</span>
                             <span className="text-white/60">ALPHA-07</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                             <span className="text-white/10 uppercase tracking-widest">Matrix Sync</span>
                             <span className="text-emerald-500">OPTIMAL</span>
                          </div>
                       </div>

                       <motion.button 
                         whileHover={{ y: -2 }}
                         className="mt-8 w-full py-4 bg-white/[0.03] hover:bg-blue-600 hover:text-white border border-white/5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.3em] text-white/30 transition-all duration-500"
                        >
                          Decrypt Profile
                        </motion.button>
                    </motion.div>
                  ))}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
