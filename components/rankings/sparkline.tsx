"use client";

import { motion } from "framer-motion";

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
};

export function Sparkline({
  values,
  width = 80,
  height = 24,
  color = "currentColor",
  fill
}: SparklineProps) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], index) => (index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {fill ? <motion.path d={areaPath} fill={fill} opacity={0.18} /> : null}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.circle
        cx={points[points.length - 1]![0]}
        cy={points[points.length - 1]![1]}
        r={2}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.4, 1] }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
    </svg>
  );
}
