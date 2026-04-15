"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Clock, History, Calendar, Shield, Activity } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LiveTimer } from "@/components/ui/LiveTimer";

interface SeatDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  seat: any;
}

export const SeatDetailPanel = ({ isOpen, onClose, seat }: SeatDetailPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/5 z-[101] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 relative">
              <button 
                onClick={onClose}
                className="absolute right-8 top-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white/40" />
              </button>
              
              <div className="flex flex-col gap-4">
                <StatusBadge status={seat?.is_occupied ? "occupied" : "empty"} className="w-fit" />
                <div>
                  <h2 className="text-3xl font-bold font-outfit tracking-tight text-white">{seat?.id}</h2>
                  <p className="text-white/30 text-sm font-medium uppercase tracking-[0.2em] mt-1">Telemetry Analysis Window</p>
                </div>
              </div>
            </div>

            {/* Content scrolls */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
              {/* Main Worker Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <User size={12} />
                  Personnel Data
                </div>
                
                <div className="glass-card p-6 flex flex-col items-center text-center gap-4 border-white/5 bg-white/[0.01]">
                   <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
                      {seat?.worker_name?.charAt(0) || "?"}
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">{seat?.worker_name || "Unassigned"}</h3>
                      <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mt-1">Staff ID: {seat?.worker_id || "N/A"}</p>
                   </div>
                </div>
              </section>

              {/* Status & Timing */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <Activity size={12} />
                  Active Session
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="glass-card p-4 space-y-1 bg-white/[0.01]">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active For</span>
                      <div className="text-lg font-mono font-bold text-white">
                        {seat?.is_occupied ? <LiveTimer startTime={seat.start_time || new Date()} /> : "--:--:--"}
                      </div>
                   </div>
                   <div className="glass-card p-4 space-y-1 bg-white/[0.01]">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Compliance</span>
                      <div className="text-lg font-bold text-emerald-500">98.2%</div>
                   </div>
                </div>
              </section>

              {/* Session Timeline */}
              <section className="space-y-6 pb-10">
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <History size={12} />
                  Session Timeline
                </div>
                <div className="space-y-4">
                   {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4 group">
                         <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 group-first:bg-blue-400 group-first:animate-pulse" />
                            <div className="w-[1px] flex-1 bg-white/5 my-1 group-last:hidden" />
                         </div>
                         <div className="flex-1 pb-4">
                            <p className="text-xs font-bold text-white/80">Occurence Deteced</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Today at 0{9+i}:45 AM // Zone {i}</p>
                         </div>
                      </div>
                   ))}
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md">
               <button className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-neutral-200 transition-colors shadow-xl shadow-white/5">
                  Reset Node Connection
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
