'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideUser, LucideRoute, LucideClock, LucideArmchair } from 'lucide-react';
import { PersonTracking } from '@/lib/video-test/types';

interface PersonTrackingPanelProps {
  personTracking: PersonTracking[] | null;
  selectedPerson: string | null;
  onSelectPerson: (personId: string | null) => void;
}

export default function PersonTrackingPanel({
  personTracking,
  selectedPerson,
  onSelectPerson,
}: PersonTrackingPanelProps) {
  if (!personTracking || personTracking.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <LucideUser size={18} className="text-indigo-400" />
          Person Tracking
        </h3>
        <p className="text-sm text-zinc-500 text-center py-4">
          No person tracking data available.
          <br />
          Enable &quot;Person Tracking&quot; mode to track individual people.
        </p>
      </motion.div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card surface-3d p-6"
    >
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <LucideUser size={18} className="text-indigo-400" />
        Person Tracking
        <span className="ml-auto text-xs text-zinc-500">
          {personTracking.length} person{personTracking.length !== 1 ? 's' : ''} detected
        </span>
      </h3>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {personTracking.map((person) => (
          <button
            key={person.person_id}
            onClick={() => onSelectPerson(selectedPerson === person.person_id ? null : person.person_id)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedPerson === person.person_id
                ? 'border-indigo-500/50 bg-indigo-500/10'
                : 'border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-800'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <LucideUser size={16} className="text-indigo-400" />
                </div>
                <span className="font-medium">{person.person_id}</span>
              </div>
              <span className="text-xs text-zinc-400">
                {person.path_points_count} path points
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <LucideClock size={12} />
                <span>Visible: {formatDuration(person.total_visible_time_seconds)}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <LucideArmchair size={12} />
                <span>
                  Seats: {person.seat_interactions.length > 0 
                    ? person.seat_interactions.join(', ') 
                    : 'None'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <LucideClock size={12} />
                <span>First seen: {formatTime(person.first_seen)}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <LucideClock size={12} />
                <span>Last seen: {formatTime(person.last_seen)}</span>
              </div>
            </div>

            {/* Seat Interactions */}
            {person.seat_interactions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700/50">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <LucideRoute size={12} />
                  <span>Seat Interactions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {person.seat_interactions.map((seatId) => (
                    <span
                      key={seatId}
                      className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded"
                    >
                      {seatId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedPerson && (
        <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <p className="text-xs text-indigo-400">
            Selected: <span className="font-medium">{selectedPerson}</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            This person&apos;s path and interactions are highlighted in the timeline
          </p>
        </div>
      )}
    </motion.div>
  );
}
