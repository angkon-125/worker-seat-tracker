'use client';

import React from 'react';
import { LucideArmchair, LucideClock3, LucideDoorClosed, LucideLayers3, LucideSparkles } from 'lucide-react';
import { SeatSummary } from '@/lib/video-test/types';

interface ResultStatsProps {
  seats: SeatSummary[];
}

export default function ResultStats({ seats }: ResultStatsProps) {
  const totalOccupiedTime = seats.reduce((sum, seat) => sum + seat.total_occupied_time_seconds, 0);
  const totalSessions = seats.reduce((sum, seat) => sum + seat.total_sessions, 0);
  const mostActiveSeat = [...seats].sort((a, b) => b.total_occupied_time_seconds - a.total_occupied_time_seconds)[0];
  const idleSeats = seats.filter((seat) => seat.total_sessions === 0);

  const cards = [
    { label: 'Total Seats', value: seats.length.toString(), icon: LucideArmchair },
    { label: 'Total Occupied Time', value: formatDuration(totalOccupiedTime), icon: LucideClock3 },
    { label: 'Total Sessions', value: totalSessions.toString(), icon: LucideLayers3 },
    {
      label: 'Most Active Seat',
      value: mostActiveSeat ? `${mostActiveSeat.seat_id} (${formatDuration(mostActiveSeat.total_occupied_time_seconds)})` : 'None',
      icon: LucideSparkles,
    },
    { label: 'Idle Seats', value: idleSeats.length > 0 ? idleSeats.map((seat) => seat.seat_id).join(', ') : 'None', icon: LucideDoorClosed },
  ];

  return (
    <div className="glass-card surface-3d p-5">
      <h3 className="font-semibold mb-4">Result Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-3">
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <Icon size={14} />
                {card.label}
              </p>
              <p className="text-sm text-zinc-100 mt-1 font-medium">{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
