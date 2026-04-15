"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCcw,
  Zap,
  Activity,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SeatGrid } from "@/components/seats/SeatGrid";
import { SeatCard } from "@/components/seats/SeatCard";
import { getSeats } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { SeatDetailPanel } from "@/components/seats/SeatDetailPanel";

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
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export default function SeatsPage() {
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getSeats();
      setSeats(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching seats:", error);
    }
  };

  const pollLiveStatus = async () => {
    try {
      // getLiveStatus imported implicitly via api or dynamic import
      const { getLiveStatus } = await import("@/lib/api");
      const statusData = await getLiveStatus();
      
      setSeats(prevSeats => prevSeats.map(seat => {
        const liveSeat = statusData.seats.find((s: any) => s.seat_id === seat.id);
        if (liveSeat) {
          return { ...seat, is_occupied: liveSeat.is_occupied };
        }
        return seat;
      }));
    } catch (error) {
      console.warn("Live status poll failed:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(pollLiveStatus, 2000); // Poll every 2s in-memory
    return () => clearInterval(interval);
  }, []);

  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    setIsPanelOpen(true);
  };

  const filteredSeats = seats.filter(seat => {
    if (filter === "occupied") return seat.is_occupied;
    if (filter === "empty") return !seat.is_occupied;
    return true;
  });

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
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Node Management</h2>
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">Seat Intelligence</h1>
          <p className="text-white/30 text-sm font-medium">Global occupancy distribution and node telemetry.</p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            onClick={() => { setLoading(true); fetchData(); }}
            className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-white/40 hover:text-white"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </motion.button>
          <div className="h-10 w-[1px] bg-white/[0.05] mx-2" />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all"
          >
            <Zap size={16} fill="currentColor" />
            Auto-Assign Nodes
          </motion.button>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 bg-white/[0.01] border border-white/[0.05] rounded-3xl backdrop-blur-md transition-all hover:bg-white/[0.02]">
        <div className="flex items-center gap-4 flex-1 px-5">
           <Search size={20} className="text-white/20" />
           <input 
             type="text" 
             placeholder="Query seat ID, worker signature or sector..." 
             className="bg-transparent border-none outline-none text-sm w-full py-3 text-white placeholder:text-white/20 font-medium"
           />
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-black/40 rounded-2xl border border-white/5">
          {[
            { id: 'all', label: 'All Clusters' },
            { id: 'occupied', label: 'Occupied' },
            { id: 'empty', label: 'Available' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === opt.id 
                  ? "bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-lg" 
                  : "text-white/20 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Seat Visualization Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-3xl skeleton-shimmer" />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {filteredSeats.map((seat) => (
                <SeatCard 
                  key={seat.id} 
                  {...seat} 
                  status={seat.is_occupied ? "occupied" : "empty"}
                  onClick={() => handleSeatClick(seat)} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && filteredSeats.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10"
        >
           <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10 mb-8 border border-white/5">
              <Users size={48} />
           </div>
           <h3 className="text-2xl font-bold text-white/60 tracking-tight">System Desynchronized</h3>
           <p className="text-sm text-white/20 mt-2 font-medium">No nodes match the current filter parameters.</p>
           <button 
             onClick={() => setFilter('all')}
             className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Reset Protocols
            </button>
        </motion.div>
      )}

      {/* Advanced Detail Sidebar */}
      <SeatDetailPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        seat={selectedSeat} 
      />
    </motion.div>
  );
}

