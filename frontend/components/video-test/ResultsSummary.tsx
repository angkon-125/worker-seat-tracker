'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideClock, LucideUsers, LucideActivity, LucideDownload, LucideVideo } from 'lucide-react';
import { VideoAnalysisResult } from '@/lib/video-test/types';

interface ResultsSummaryProps {
  result: VideoAnalysisResult;
  onDownloadAnnotated?: () => void;
}

export default function ResultsSummary({ result, onDownloadAnnotated }: ResultsSummaryProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const totalOccupancyTime = result.seat_summaries.reduce(
    (sum, seat) => sum + seat.total_occupied_time_seconds,
    0
  );
  const totalSessions = result.seat_summaries.reduce(
    (sum, seat) => sum + seat.total_sessions,
    0
  );
  const avgOccupancyRate =
    result.seat_summaries.reduce((sum, seat) => sum + (seat.occupancy_rate || 0), 0) /
    result.seat_summaries.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card surface-3d p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <LucideActivity size={18} className="text-indigo-400" />
          Analysis Results
        </h3>
        {result.annotated_video_path && onDownloadAnnotated && (
          <button
            onClick={onDownloadAnnotated}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors text-sm"
          >
            <LucideDownload size={14} />
            Annotated Video
          </button>
        )}
      </div>

      {/* Video Summary */}
      <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg">
        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Video Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem
            label="Duration"
            value={formatDuration(result.video_summary.duration_seconds)}
            icon={<LucideClock size={16} />}
          />
          <StatItem
            label="Processed Frames"
            value={result.video_summary.processed_frames.toString()}
            icon={<LucideVideo size={16} />}
          />
          <StatItem
            label="Processing Time"
            value={formatDuration(result.video_summary.processing_time_seconds)}
            icon={<LucideActivity size={16} />}
          />
          <StatItem
            label="FPS"
            value={result.video_summary.fps.toFixed(1)}
            icon={<LucideActivity size={16} />}
          />
        </div>
      </div>

      {/* Overall Stats */}
      <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg">
        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Overall Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem
            label="Total Seats"
            value={result.seat_summaries.length.toString()}
            icon={<LucideUsers size={16} />}
          />
          <StatItem
            label="Total Sessions"
            value={totalSessions.toString()}
            icon={<LucideActivity size={16} />}
          />
          <StatItem
            label="Occupied Time"
            value={formatDuration(totalOccupancyTime)}
            icon={<LucideClock size={16} />}
          />
          <StatItem
            label="Avg Occupancy"
            value={`${avgOccupancyRate.toFixed(1)}%`}
            icon={<LucideActivity size={16} />}
          />
        </div>
      </div>

      {/* Seat Breakdown */}
      <div>
        <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Seat Breakdown</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {result.seat_summaries.map((seat) => (
            <div key={seat.seat_id} className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{seat.seat_id}</span>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>{seat.total_sessions} sessions</span>
                  <span>{formatDuration(seat.total_occupied_time_seconds)}</span>
                  <span>{(seat.occupancy_rate || 0).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${seat.occupancy_rate || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Person Tracking */}
      {result.person_tracking && result.person_tracking.length > 0 && (
        <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
          <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Person Tracking</h4>
          <div className="space-y-2">
            {result.person_tracking.map((person) => (
              <div key={person.person_id} className="p-3 bg-zinc-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{person.person_id}</span>
                  <span className="text-xs text-zinc-400">
                    {formatDuration(person.total_visible_time_seconds)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Seats: {person.seat_interactions.join(', ') || 'None'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-zinc-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-lg">{value}</p>
    </div>
  );
}
