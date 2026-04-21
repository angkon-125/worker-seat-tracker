'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LucideMaximize2, LucidePause, LucidePlay } from 'lucide-react';
import { FrontendSeatZone, SeatSummary } from '@/lib/video-test/types';

interface VideoPlayerWithOverlayProps {
  videoUrl: string;
  zones: FrontendSeatZone[];
  seats: SeatSummary[];
  currentTime: number;
  onTimeChange: (time: number) => void;
  selectedSeatId: string | null;
  onSelectSeat: (seatId: string) => void;
  seekToTime?: number | null;
}

export default function VideoPlayerWithOverlay({
  videoUrl,
  zones,
  seats,
  currentTime,
  onTimeChange,
  selectedSeatId,
  onSelectSeat,
  seekToTime,
}: VideoPlayerWithOverlayProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof seekToTime !== 'number' || !ref.current) return;
    ref.current.currentTime = seekToTime;
    onTimeChange(seekToTime);
  }, [seekToTime, onTimeChange]);

  const seatMap = useMemo(() => {
    return new Map(seats.map((seat) => [seat.seat_id, seat]));
  }, [seats]);

  const togglePlay = () => {
    if (!ref.current) return;
    if (isPlaying) ref.current.pause();
    else void ref.current.play();
  };

  const handleSeek = (value: number) => {
    if (!ref.current) return;
    ref.current.currentTime = value;
    onTimeChange(value);
  };

  return (
    <div className="glass-card surface-3d p-5 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="font-semibold">Video + Live Overlay</h3>
        <p className="text-xs text-zinc-500">Observe seat zones and occupancy at the current video moment.</p>
      </div>

      <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden flex-1 min-h-[280px]">
        <video
          ref={ref}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={() => onTimeChange(ref.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="absolute inset-0 pointer-events-none">
          {zones.map((zone) => {
            const seat = seatMap.get(zone.seatId);
            const occupied = Boolean(seat && isOccupied(seat, currentTime));
            const selected = selectedSeatId === zone.seatId;

            return (
              <button
                type="button"
                key={zone.seatId}
                onClick={() => onSelectSeat(zone.seatId)}
                title={`${zone.seatId} - ${occupied ? 'Occupied' : 'Empty'}`}
                className={`absolute pointer-events-auto border-2 rounded-md transition-colors ${
                  occupied ? 'border-emerald-400 bg-emerald-500/15' : 'border-zinc-400 bg-zinc-500/10'
                } ${selected ? 'ring-2 ring-indigo-400' : ''}`}
                style={{
                  left: `${zone.x1 * 100}%`,
                  top: `${zone.y1 * 100}%`,
                  width: `${(zone.x2 - zone.x1) * 100}%`,
                  height: `${(zone.y2 - zone.y1) * 100}%`,
                }}
              >
                <span className="absolute -top-6 left-0 text-[11px] px-2 py-0.5 rounded bg-black/70 text-white whitespace-nowrap">
                  {zone.seatId}: {occupied ? 'Occupied' : 'Empty'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex items-center justify-between mt-2">
          <button onClick={togglePlay} className="p-2 rounded-full bg-zinc-700/80 hover:bg-zinc-600/80 transition-colors">
            {isPlaying ? <LucidePause size={16} /> : <LucidePlay size={16} />}
          </button>
          <p className="text-xs text-zinc-400">
            {formatClock(currentTime)} / {formatClock(duration)}
          </p>
          <button
            onClick={() => containerRef.current?.requestFullscreen()}
            className="p-2 rounded-full bg-zinc-700/80 hover:bg-zinc-600/80 transition-colors"
          >
            <LucideMaximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function isOccupied(seat: SeatSummary, time: number) {
  return seat.sessions.some((session) => {
    const end = session.end_time ?? Number.POSITIVE_INFINITY;
    return time >= session.start_time && time <= end;
  });
}

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
