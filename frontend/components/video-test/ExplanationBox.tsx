'use client';

import React from 'react';
import { LucideInfo } from 'lucide-react';

export default function ExplanationBox() {
  return (
    <div className="glass-card surface-3d p-4 border border-zinc-700/60">
      <p className="text-sm font-medium flex items-center gap-2 mb-1">
        <LucideInfo size={16} className="text-indigo-400" />
        How to read these results
      </p>
      <p className="text-xs text-zinc-400 leading-relaxed">
        The system detects people in each frame, checks whether they are inside a seat zone, and marks that seat as
        occupied for that period. Sessions show when occupancy starts and ends. Click any occupied timeline segment to
        jump directly to that moment in the video and verify if the detection is correct.
      </p>
    </div>
  );
}
