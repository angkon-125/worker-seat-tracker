"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveTimerProps {
  startTime: string | Date;
  className?: string;
  isActive?: boolean;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ startTime, className, isActive = true }) => {
  const [time, setTime] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTime({
        h: hours.toString().padStart(2, "0"),
        m: minutes.toString().padStart(2, "0"),
        s: seconds.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  return (
    <div className={className}>
      <Digit value={time.h} />
      <span>:</span>
      <Digit value={time.m} />
      <span>:</span>
      <Digit value={time.s} />
    </div>
  );
};

function Digit({ value }: { value: string }) {
  return (
    <div className="inline-flex overflow-hidden h-[1.2em] relative tabular-nums min-w-[2ch] justify-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
