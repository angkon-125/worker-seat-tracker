'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideSettings, LucideActivity, LucideUser, LucideScan } from 'lucide-react';
import { AnalysisMode } from '@/lib/video-test/types';

interface AnalysisControlsProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  frameSkip: number;
  onFrameSkipChange: (value: number) => void;
  occupancyThreshold: number;
  onOccupancyThresholdChange: (value: number) => void;
  enablePersonTracking: boolean;
  onPersonTrackingChange: (enabled: boolean) => void;
  saveAnnotatedVideo: boolean;
  onAnnotatedVideoChange: (enabled: boolean) => void;
}

export default function AnalysisControls({
  mode,
  onModeChange,
  frameSkip,
  onFrameSkipChange,
  occupancyThreshold,
  onOccupancyThresholdChange,
  enablePersonTracking,
  onPersonTrackingChange,
  saveAnnotatedVideo,
  onAnnotatedVideoChange,
}: AnalysisControlsProps) {
  const modes = [
    { id: AnalysisMode.SEAT_OCCUPANCY_ONLY, label: 'Seat Only', icon: LucideActivity, desc: 'Fastest, zone occupancy only' },
    { id: AnalysisMode.VIDEO_PERSON_TRACKING, label: 'Person Tracking', icon: LucideUser, desc: 'Track temporary person IDs' },
    { id: AnalysisMode.HYBRID_DEBUG, label: 'Hybrid Debug', icon: LucideScan, desc: 'Full debug with overlays' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card surface-3d p-5"
    >
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <LucideSettings size={16} className="text-indigo-400" />
        Analysis Configuration
      </h3>

      {/* Analysis Mode Selection */}
      <div className="mb-5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 block">Analysis Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`p-2.5 rounded-lg border transition-all text-left ${
                  mode === m.id
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                }`}
              >
                <Icon size={18} className="mb-1.5" />
                <p className="text-xs font-medium leading-tight">{m.label}</p>
                <p className="text-[9px] opacity-70 leading-tight mt-0.5">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Skip */}
      <div className="mb-3">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
          Frame Skip: {frameSkip}
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={frameSkip}
          onChange={(e) => onFrameSkipChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
          <span>1</span>
          <span>6 (Recommended)</span>
          <span>12</span>
        </div>
      </div>

      {/* Occupancy Threshold */}
      <div className="mb-3">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
          Occupancy Threshold: {occupancyThreshold.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.1"
          value={occupancyThreshold}
          onChange={(e) => onOccupancyThresholdChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
          <span>0.1</span>
          <span>0.4 (Recommended)</span>
          <span>0.9</span>
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-2">
        <ToggleOption
          label="Enable Person Tracking"
          description="Assign temporary IDs (P1, P2...)"
          enabled={enablePersonTracking}
          onToggle={onPersonTrackingChange}
        />
        <ToggleOption
          label="Save Annotated Video"
          description="Generate output video with overlays"
          enabled={saveAnnotatedVideo}
          onToggle={onAnnotatedVideoChange}
        />
      </div>
    </motion.div>
  );
}

function ToggleOption({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className="w-full flex items-center justify-between p-2.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
    >
      <div className="text-left flex-1 pr-3">
        <p className="text-xs font-medium leading-tight">{label}</p>
        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{description}</p>
      </div>
      <div
        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-indigo-500' : 'bg-zinc-700'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}
