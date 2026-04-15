"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CountUp } from "./CountUp";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isUp?: boolean;
    label?: string;
  };
  className?: string;
  status?: "online" | "offline";
  delay?: number;
  suffix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className,
  status,
  delay = 0,
  suffix
}) => {
  const isNumeric = typeof value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        "group relative glass-card p-6 overflow-hidden",
        className
      )}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 blur-[60px] group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/50 group-hover:text-primary transition-all duration-300"
        >
          {icon}
        </motion.div>
        
        {status && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur-md",
            status === "online" 
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
              : "bg-red-500/10 text-red-500 border-red-500/20"
          )}>
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn("w-1.5 h-1.5 rounded-full", status === "online" ? "bg-emerald-500" : "bg-red-500")} 
            />
            {status}
          </div>
        )}
      </div>

      <div className="mt-10 relative z-10">
        <h3 className="text-4xl font-bold font-outfit tracking-tight text-white mb-1">
          {isNumeric ? (
            <div className="flex items-baseline">
              <CountUp value={value as number} duration={2.5} />
              {suffix && <span className="text-lg ml-1 opacity-40 font-bold">{suffix}</span>}
            </div>
          ) : (
            <span>{value}{suffix}</span>
          )}
        </h3>
        <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">
          {title}
        </p>
      </div>

      {trend && (
        <div className="mt-8 flex items-center gap-3 relative z-10">
          <div className={cn(
            "flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold",
            trend.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend.isUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trend.value}
          </div>
          <span className="text-[11px] text-white/20 font-bold uppercase tracking-widest">{trend.label || "Flow"}</span>
        </div>
      )}
      
      {/* Decorative Line Animation */}
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 w-full"
        initial={{ scaleX: 0, opacity: 0 }}
        whileHover={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};
