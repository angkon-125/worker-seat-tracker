"use client";

import { useState } from "react";
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  User,
  Save,
  Trash2,
  HardDrive,
  Cpu,
  Monitor,
  ShieldCheck,
  Activity,
  Zap,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "infrastructure", label: "Infrastructure", icon: Database },
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-12 pb-20 max-w-6xl"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full glow-blue" />
             <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Core Configuration</h2>
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">System Parameters</h1>
          <p className="text-white/30 text-sm font-medium">Fine-tune spatial intelligence and orchestration protocols.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="px-4 py-2 border-l border-white/5 hidden md:block">
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Auth Level</span>
              <p className="text-xs font-bold text-blue-500">Root-Admin</p>
           </div>
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all"
           >
              <RefreshCw size={16} />
              Re-Sync Core
           </motion.button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Tabs */}
        <aside className="lg:w-72 shrink-0">
          <motion.nav variants={itemVariants} className="flex lg:flex-col gap-2 overflow-x-auto pb-6 lg:pb-0 custom-scrollbar sticky top-32">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                    isActive 
                      ? "text-blue-500" 
                      : "text-white/20 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  <tab.icon size={20} className={cn("transition-transform duration-500", isActive && "scale-110")} />
                  <span className="tracking-tight">{tab.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="active-settings-pill"
                      className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-2xl z-[-1]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {isActive && (
                    <motion.div 
                      layoutId="active-settings-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                    />
                  )}
                </button>
              );
            })}
          </motion.nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-10 space-y-12 border-white/[0.03] min-h-[600px] flex flex-col"
            >
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "infrastructure" && <InfrastructureSettings />}
              {activeTab !== "general" && activeTab !== "infrastructure" && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-10">
                    <Activity size={80} className="mb-8" />
                    <h3 className="text-2xl font-black uppercase tracking-[0.4em]">Encrypted Module</h3>
                    <p className="text-sm font-bold mt-2">Protocols for {activeTab} are pending clearance.</p>
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-blue-500">
           <Settings size={22} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Global Preferences</h3>
          <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] mt-1">Operational Interface Hub</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all group">
           <div className="flex flex-col gap-1.5">
              <span className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">Neural Theme Engine</span>
              <span className="text-xs text-white/20 font-medium">Automatic interface adaptation based on lighting or cycle.</span>
           </div>
           <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
              <button className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-600/20">Dark Mode</button>
              <button className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Digital Light</button>
           </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all group">
           <div className="flex flex-col gap-1.5">
              <span className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">Synchronous Polling</span>
              <span className="text-xs text-white/20 font-medium">Frequency of telemetric data ingestion.</span>
           </div>
           <select className="bg-black/60 border border-white/10 rounded-2xl px-6 py-3 text-xs font-black text-white/60 outline-none focus:border-blue-500/50 appearance-none min-w-[180px] shadow-xl uppercase tracking-widest">
              <option>05 SECONDS</option>
              <option>10 SECONDS</option>
              <option>30 SECONDS</option>
              <option>REAL-TIME SYNC</option>
           </select>
        </div>
      </div>

      <div className="pt-10 mt-auto border-t border-white/[0.03] flex items-center gap-4">
         <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-white/5"
          >
            <Save size={16} />
            Commit Changes
         </motion.button>
         <button className="px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all">
            Discard
         </button>
      </div>
    </div>
  );
}

function InfrastructureSettings() {
  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-blue-500">
           <Database size={22} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Mainframe Infrastructure</h3>
          <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em] mt-1">Core Telemetry & Storage Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] hover:border-blue-500/20 transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
            <div className="flex items-center gap-5 mb-6">
               <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/10">
                  <Cpu size={24} />
               </div>
               <div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Compute Unit</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">YOLO-v8X Core</h4>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/20 font-black uppercase">Status</span>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Master Stable</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "84%" }}
                    className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"
                  />
               </div>
            </div>
         </div>

         <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] hover:border-indigo-500/20 transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
            <div className="flex items-center gap-5 mb-6">
               <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
                  <HardDrive size={24} />
               </div>
               <div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Vault Storage</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">PostgreSQL-16</h4>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/20 font-black uppercase">Capacity</span>
                  <span className="text-[10px] text-white/60 font-bold">48.2 GB / 512 GB</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "9.4%" }}
                    className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"
                  />
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Authorized RTSP Uplinks</h4>
            <span className="text-[10px] text-white/10 font-black uppercase tracking-widest">Active nodes: 03</span>
         </div>
         <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 5 }}
                className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.03] bg-white/[0.01] group hover:bg-white/[0.03] hover:border-white/[0.08] transition-all"
              >
                 <div className="flex items-center gap-5">
                    <div className="p-2.5 rounded-xl bg-white/5 text-white/20 group-hover:text-blue-500/60 transition-colors">
                       <Monitor size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-bold text-white tracking-tight">RTSP-STREAM-0{i}</span>
                       <span className="text-[10px] font-mono text-white/20 group-hover:text-white/40 transition-colors">rtsp://vision_node_0{i}:554/broadcast</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={14} className="text-emerald-500/40" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Verified</span>
                    </div>
                    <button className="text-red-500/20 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-all">
                       <Trash2 size={18} />
                    </button>
                 </div>
              </motion.div>
            ))}
         </div>
         
         <button className="w-full py-4 border border-dashed border-white/10 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/10 hover:text-blue-500 transition-all group">
            <div className="flex items-center justify-center gap-3">
               <Zap size={14} className="group-hover:fill-current" />
               Register New Master Node
            </div>
         </button>
      </div>
    </div>
  );
}
