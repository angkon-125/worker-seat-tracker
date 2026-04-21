'use client';

import React from 'react';
import { OccupancySession } from '@/lib/video-test/types';

interface TimelineBarProps {
  duration: number;
  sessions: OccupancySession[];
  currentTime?: number;
  compact?: boolean;
  selected?: boolean;
  onSeek?: (time: number) => void;
}

export default function TimelineBar({
  duration,
  sessions,
  currentTime = 0,
  compact = false,
  selected = false,
  onSeek,
}: TimelineBarProps) {
  const safeDuration = Math.max(duration, 1);

  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden border ${
        selected ? 'border-indigo-400/60' : 'border-zinc-700/60'
      } ${compact ? 'h-6' : 'h-8'} bg-zinc-800/80`}
    >
      {sessions.map((session) => {
        const start = Math.max(0, Math.min(session.start_time, safeDuration));
        const end = Math.max(start, Math.min(session.end_time ?? safeDuration, safeDuration));
        const left = (start / safeDuration) * 100;
        const width = Math.max(((end - start) / safeDuration) * 100, 0.6);

        return (
          <button
            key={session.session_id}
            type="button"
            onClick={() => onSeek?.(start)}
            title={`${formatClock(start)} - ${formatClock(end)} (${formatDuration(end - start)})`}
            className="absolute top-0 bottom-0 bg-emerald-500/90 hover:bg-emerald-400 transition-colors"
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        );
      })}

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-indigo-300 pointer-events-none"
        style={{ left: `${(Math.max(0, Math.min(currentTime, safeDuration)) / safeDuration) * 100}%` }}
      />
    </div>
  );
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
