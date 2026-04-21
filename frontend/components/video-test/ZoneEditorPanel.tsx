'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideMapPin, LucidePlus, LucideTrash2 } from 'lucide-react';

interface SeatZone {
  seatId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

interface ZoneEditorPanelProps {
  zones: SeatZone[];
  onZonesChange: (zones: SeatZone[]) => void;
}

export default function ZoneEditorPanel({ zones, onZonesChange }: ZoneEditorPanelProps) {
  const [newZoneId, setNewZoneId] = useState('');

  const addZone = () => {
    if (!newZoneId.trim()) return;

    const newZone: SeatZone = {
      seatId: newZoneId,
      x1: 0.2,
      y1: 0.2,
      x2: 0.4,
      y2: 0.6,
      label: newZoneId,
    };

    onZonesChange([...zones, newZone]);
    setNewZoneId('');
  };

  const removeZone = (seatId: string) => {
    onZonesChange(zones.filter((z) => z.seatId !== seatId));
  };

  const updateZone = (seatId: string, field: keyof SeatZone, value: number | string) => {
    onZonesChange(
      zones.map((z) => (z.seatId === seatId ? { ...z, [field]: value } : z))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card surface-3d p-6"
    >
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <LucideMapPin size={18} className="text-indigo-400" />
        Seat Zones
      </h3>

      {/* Add New Zone */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newZoneId}
          onChange={(e) => setNewZoneId(e.target.value)}
          placeholder="Seat ID (e.g., A1, T1-S1)"
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-indigo-500/50 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && addZone()}
        />
        <button
          onClick={addZone}
          className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors"
        >
          <LucidePlus size={18} />
        </button>
      </div>

      {/* Zone List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {zones.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">
            No seat zones defined. Add a zone to begin analysis.
          </p>
        ) : (
          zones.map((zone: any) => (
            <div key={zone.seatId} className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={zone.seatId}
                  onChange={(e) => updateZone(zone.seatId, 'seatId', e.target.value)}
                  className="font-medium text-sm bg-transparent border-b border-zinc-700 focus:border-indigo-500/50 focus:outline-none w-24"
                />
                <button
                  onClick={() => removeZone(zone.seatId)}
                  className="p-1 hover:bg-rose-500/20 rounded transition-colors"
                >
                  <LucideTrash2 size={16} className="text-rose-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-zinc-500 block mb-1">X1</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={zone.x1}
                    onChange={(e) => updateZone(zone.seatId, 'x1', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Y1</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={zone.y1}
                    onChange={(e) => updateZone(zone.seatId, 'y1', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">X2</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={zone.x2}
                    onChange={(e) => updateZone(zone.seatId, 'x2', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Y2</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={zone.y2}
                    onChange={(e) => updateZone(zone.seatId, 'y2', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Presets */}
      <div className="mt-4 pt-4 border-t border-zinc-700">
        <p className="text-xs text-zinc-500 mb-2">Quick Presets</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              const presetZones: SeatZone[] = [
                { seatId: 'A', x1: 0.3, y1: 0.2, x2: 0.7, y2: 0.8 },
              ];
              onZonesChange(presetZones);
            }}
            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 text-xs rounded-lg transition-colors"
          >
            1 Seat (A)
          </button>
          <button
            onClick={() => {
              onZonesChange([]);
            }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-500/20 text-rose-400 text-xs rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </motion.div>
  );
}
