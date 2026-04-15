"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, MapPin, Eye, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LiveTimer } from "@/components/ui/LiveTimer";

interface SeatCardProps {
  id: string;
  workerName?: string;
  status: "occupied" | "empty" | "alert";
  startTime?: string | Date;
  zone?: string;
  onClick?: () => void;
}

export const SeatCard: React.FC<SeatCardProps> = ({ 
  id, 
  workerName, 
  status, 
  startTime, 
  zone = "Zone A",
  onClick
}) => {
  const isOccupied = status === "occupied";
  const isAlert = status === "alert";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        y: -10, 
        scale: 1.03,
        transition: { type: "spring", stiffness: 400, damping: 25 } 
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative glass-card p-6 flex flex-col gap-5 group cursor-pointer overflow-hidden transition-all duration-500",
        isOccupied && "glow-blue border-blue-500/20 bg-blue-500/[0.02]",
        isAlert && "glow-red border-red-500/30 bg-red-500/[0.03]",
        !isOccupied && !isAlert && "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
      )}
    >
      {/* Animated Glow Overlay */}
      <AnimatePresence>
        {(isOccupied || isAlert) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 pointer-events-none",
              isOccupied ? "bg-gradient-to-br from-blue-600/5 to-transparent" : "bg-gradient-to-br from-red-600/5 to-transparent"
            )}
          />
        )}
      </AnimatePresence>

      {/* Breathing Border for Occupied/Alert */}
      {(isOccupied || isAlert) && (
        <motion.div 
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 border-2 rounded-2xl pointer-events-none",
            isOccupied ? "border-blue-500/10" : "border-red-500/20"
          )}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex flex-col gap-1">
          <motion.span 
            className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]"
            layoutId={`id-${id}`}
          >
            {id}
          </motion.span>
          <motion.h4 
            className={cn(
              "text-base font-bold tracking-tight transition-colors",
              isOccupied ? "text-white" : "text-white/40"
            )}
            layoutId={`name-${id}`}
          >
            {workerName || "Available Node"}
          </motion.h4>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Body */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2.5 text-[11px] font-bold text-white/30">
          <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
            <MapPin size={12} />
          </div>
          <span className="tracking-wide uppercase">{zone} // LEVEL 02</span>
        </div>
        
        <div className="h-10 flex items-center">
          <AnimatePresence mode="wait">
            {isOccupied || isAlert ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl border backdrop-blur-md",
                  isOccupied ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                )}
              >
                <Clock size={14} className={isAlert ? "animate-pulse" : ""} />
                <LiveTimer startTime={startTime || new Date()} className="text-sm font-mono font-bold" />
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                Standing By
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
         <motion.button 
           whileHover={{ x: 5 }}
           className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors group/btn"
         >
            <Eye size={12} className="group-hover/btn:text-blue-500 transition-colors" />
            Inspect Node
         </motion.button>
         
         {isAlert && (
           <motion.div
             animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
             transition={{ duration: 0.5, repeat: Infinity }}
           >
             <AlertCircle size={18} className="text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
           </motion.div>
         )}
         
         {!isOccupied && !isAlert && (
           <Zap size={14} className="text-white/5 group-hover:text-amber-500/40 transition-colors" />
         )}
      </div>

      {/* Shine Effect Animation on Hover */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none" />
    </motion.div>
  );
};
