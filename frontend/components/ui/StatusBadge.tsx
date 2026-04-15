"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "occupied" | "empty" | "active" | "alert";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
      case "active":
        return {
          label: "Active",
          color: "bg-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          text: "text-emerald-500",
        };
      case "occupied":
        return {
          label: "Occupied",
          color: "bg-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          text: "text-blue-500",
        };
      case "alert":
        return {
          label: "Alert",
          color: "bg-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          text: "text-red-500",
        };
      case "empty":
        return {
          label: "Available",
          color: "bg-zinc-500",
          bg: "bg-zinc-500/10",
          border: "border-zinc-500/20",
          text: "text-zinc-400",
        };
      default:
        return {
          label: "Offline",
          color: "bg-zinc-600",
          bg: "bg-zinc-900/40",
          border: "border-white/5",
          text: "text-zinc-500",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn(
      "flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
      config.bg,
      config.border,
      config.text,
      className
    )}>
      <div className="relative flex h-2 w-2">
        {status !== "offline" && status !== "empty" && (
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", config.color)}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)} />
      </div>
      {config.label}
    </div>
  );
};
