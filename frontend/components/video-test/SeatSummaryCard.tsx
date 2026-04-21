'use client';

import React from 'react';
import { SeatSummary } from '@/lib/video-test/types';
import TimelineBar from '@/components/video-test/TimelineBar';

interface SeatSummaryCardProps {
  seat: SeatSummary;
  videoDuration: number;
  currentTime: number;
  selected: boolean;
  onSelect: (seatId: string) => void;
  onSeek: (time: number) => void;
}

export default function SeatSummaryCard({
  seat,
  videoDuration,
  currentTime,
  selected,
  onSelect,
  onSeek,
}: SeatSummaryCardProps) {
  const status = isSeatOccupiedAtTime(seat, currentTime) ? 'Active' : 'Inactive';

  return (
    <div
      className={`glass-card p-4 border transition-colors ${
        selected ? 'border-indigo-500/60' : 'border-zinc-700/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <button onClick={() => onSelect(seat.seat_id)} className="text-left">
          <p className="text-base font-semibold">{seat.seat_id}</p>
          <p className={`text-xs ${status === 'Active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
            Status: {status}
          </p>
        </button>
        <div className="text-right text-sm">
          <p className="text-zinc-300">{formatDuration(seat.total_occupied_time_seconds)}</p>
          <p className="text-zinc-500">{seat.total_sessions} sessions</p>
        </div>
      </div>

      <TimelineBar
        duration={videoDuration}
        sessions={seat.sessions}
        currentTime={currentTime}
        selected={selected}
        onSeek={onSeek}
      />

      <div className="mt-3 space-y-1.5">
        {seat.sessions.length === 0 ? (
          <p className="text-xs text-zinc-500">No occupied sessions detected.</p>
        ) : (
          seat.sessions.map((session, idx) => {
            const end = session.end_time ?? videoDuration;
            return (
              <button
                key={session.session_id}
                onClick={() => onSeek(session.start_time)}
                className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded bg-zinc-800/70 hover:bg-zinc-700/70 transition-colors"
              >
                <span>
                  {idx + 1}. {formatClock(session.start_time)} - {formatClock(end)}
                </span>
                <span className="text-zinc-400">{formatDuration(end - session.start_time)}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function isSeatOccupiedAtTime(seat: SeatSummary, currentTime: number) {
  return seat.sessions.some((session) => {
    const end = session.end_time ?? Number.POSITIVE_INFINITY;
    return currentTime >= session.start_time && currentTime <= end;
  });
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
