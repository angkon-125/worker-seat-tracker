"use client";
import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useTransform, animate } from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function CountUp({ value, duration = 2, className, prefix = "", suffix = "" }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration]);

  useEffect(() => {
    rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
