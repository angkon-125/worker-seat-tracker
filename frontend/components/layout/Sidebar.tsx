"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Video, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Seats", href: "/seats" },
  { icon: UserCheck, label: "Workers", href: "/workers" },
  { icon: Video, label: "Cameras", href: "/cameras" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-screen flex flex-col premium-sidebar z-50 overflow-hidden"
    >
      {/* Glow Effect Top */}
      <div className="absolute top-0 left-0 w-full h-[150px] bg-blue-600/5 blur-[100px] pointer-events-none" />

      {/* Logo Section */}
      <div className={cn(
        "h-20 flex items-center px-6 gap-3 border-b border-white/[0.03]",
        isCollapsed && "justify-center px-0"
      )}>
        <motion.div 
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "anticipate" }}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0"
        >
          <ShieldCheck className="w-5 h-5 text-white" />
        </motion.div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-xl font-bold font-outfit tracking-tighter text-white"
            >
              Vision<span className="text-blue-500">Track</span>
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-10 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/10"
            >
              System Hub
            </motion.p>
          )}
        </AnimatePresence>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-blue-600/10 text-blue-500" 
                    : "text-white/30 hover:text-white hover:bg-white/[0.03]",
                  isCollapsed && "justify-center"
                )}
              >
                {/* Active Indicator Pill */}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-xl z-[-1]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <item.icon size={20} className={cn(
                  "shrink-0 transition-transform group-hover:scale-110 duration-500",
                  isActive && "text-blue-500"
                )} />
                
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-bold tracking-tight"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && !isCollapsed && (
                   <motion.div 
                     layoutId="sidebar-glow-dot"
                     className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6]"
                   />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-white/[0.03] space-y-2 relative z-10">
        <Link href="/settings">
          <motion.div 
            whileHover={{ x: 4 }}
            className={cn(
              "group flex items-center gap-3 px-3 py-3 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.03] transition-all",
              isCollapsed && "justify-center"
            )}
          >
            <Settings size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm font-bold tracking-tight">System Settings</span>}
          </motion.div>
        </Link>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] text-white/30 hover:text-white transition-all",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-bold tracking-tight text-white/20">Minimize Interface</span>}
        </motion.button>
      </div>

      {/* Decorative Glow Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[150px] bg-blue-900/5 blur-[100px] pointer-events-none" />
    </motion.aside>
  );
};
