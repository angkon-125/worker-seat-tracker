'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideClock } from 'lucide-react';
import { SeatSummary } from '@/lib/video-test/types';

interface SessionTimelineProps {
  seatSummaries: SeatSummary[];
  videoDuration: number;
  selectedPerson?: string | null;
}

export default function SessionTimeline({ seatSummaries, videoDuration, selectedPerson }: SessionTimelineProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card surface-3d p-6"
    >
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <LucideClock size={18} className="text-indigo-400" />
        Session Timeline
      </h3>

      {/* Time Scale */}
      <div className="mb-4 flex justify-between text-xs text-zinc-500">
        <span>0:00</span>
        <span>{formatTime(videoDuration / 2)}</span>
        <span>{formatTime(videoDuration)}</span>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {seatSummaries.map((seat) => (
          <div key={seat.seat_id} className="relative">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-medium w-12">{seat.seat_id}</span>
              <div className="flex-1 h-6 bg-zinc-800 rounded relative overflow-hidden">
                {seat.sessions.map((session, idx) => {
                  const startPercent = (session.start_time / videoDuration) * 100;
                  const endPercent = session.end_time
                    ? (session.end_time / videoDuration) * 100
                    : 100;
                  const widthPercent = endPercent - startPercent;
                  
                  // Highlight if selected person matches this session
                  const isSelectedPerson = selectedPerson && session.person_id === selectedPerson;

                  return (
                    <div
                      key={session.session_id}
                      className={`absolute h-full rounded-sm hover:opacity-80 transition-opacity cursor-pointer ${
                        isSelectedPerson 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 ring-2 ring-emerald-400' 
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      title={`Session ${idx + 1}: ${formatTime(session.start_time)} - ${
                        session.end_time ? formatTime(session.end_time) : 'ongoing'
                      } (${session.duration_seconds?.toFixed(1)}s)${session.person_id ? ` | Person: ${session.person_id}` : ''}`}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-zinc-500 w-16 text-right">
                {formatTime(seat.total_occupied_time_seconds)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-700 flex items-center gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-sm" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-zinc-800 rounded-sm" />
          <span>Empty</span>
        </div>
      </div>
    </motion.div>
  );
}
