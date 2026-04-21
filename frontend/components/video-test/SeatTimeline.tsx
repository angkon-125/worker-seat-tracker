'use client';

import React from 'react';
import { SeatSummary } from '@/lib/video-test/types';
import TimelineBar from '@/components/video-test/TimelineBar';

interface SeatTimelineProps {
  seats: SeatSummary[];
  videoDuration: number;
  currentTime: number;
  selectedSeatId: string | null;
  onSelectSeat: (seatId: string) => void;
  onSeek: (time: number) => void;
}

export default function SeatTimeline({
  seats,
  videoDuration,
  currentTime,
  selectedSeatId,
  onSelectSeat,
  onSeek,
}: SeatTimelineProps) {
  return (
    <div className="glass-card surface-3d p-5">
      <div className="mb-3">
        <h3 className="font-semibold">Timeline View</h3>
        <p className="text-xs text-zinc-500">
          Filled bars show occupied periods. Click any segment to jump video.
        </p>
      </div>

      <div className="grid grid-cols-[72px_1fr] items-center text-xs text-zinc-500 mb-2">
        <span>Seat</span>
        <div className="flex justify-between">
          <span>0:00</span>
          <span>{formatClock(videoDuration / 2)}</span>
          <span>{formatClock(videoDuration)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {seats.map((seat) => (
          <div key={seat.seat_id} className="grid grid-cols-[72px_1fr] items-center gap-3">
            <button
              onClick={() => onSelectSeat(seat.seat_id)}
              className={`text-left text-sm px-2 py-1 rounded ${
                selectedSeatId === seat.seat_id ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-300'
              }`}
            >
              {seat.seat_id}
            </button>
            <TimelineBar
              duration={videoDuration}
              sessions={seat.sessions}
              currentTime={currentTime}
              compact
              selected={selectedSeatId === seat.seat_id}
              onSeek={onSeek}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
