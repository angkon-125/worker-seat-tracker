"use client";
import React from "react";
import { SeatCard } from "./SeatCard";
import { motion } from "framer-motion";

interface Seat {
  id: string;
  worker_name?: string;
  is_occupied: boolean;
  start_time?: string;
  zone?: string;
}

interface SeatGridProps {
  seats: Seat[];
}

export const SeatGrid: React.FC<SeatGridProps> = ({ seats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {seats.map((seat, index) => (
        <motion.div
          key={seat.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <SeatCard
            id={seat.id}
            workerName={seat.worker_name}
            status={seat.is_occupied ? "occupied" : "empty"}
            startTime={seat.start_time}
            zone={seat.zone}
          />
        </motion.div>
      ))}
    </div>
  );
};
