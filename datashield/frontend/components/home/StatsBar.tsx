"use client";
import * as React from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

const stats = [
  { value: 4,   suffix: "",     label: "0G LAYERS",      sub: "Storage · Compute · Chain · DA",  color: "text-purple-400" },
  { value: 3,   suffix: "",     label: "AI CHECKS",      sub: "Label · Outlier · Duplicate",      color: "text-teal-400" },
  { value: 100, suffix: " $0G", label: "MIN STAKE",      sub: "Slashable quality bond",           color: "text-purple-400" },
  { value: 60,  suffix: "s",    label: "CERT TIME",      sub: "End-to-end on 0G Compute",         color: "text-teal-400" },
];

function CountUp({ to, suffix, color }: { to: number; suffix: string; color: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  React.useEffect(() => {
    if (!inView) return;
    const ctrl = animate(count, to, { duration: 1.6, ease: "easeOut" });
    return ctrl.stop;
  }, [inView, to, count]);

  return (
    <span ref={ref} className={`font-mono text-[36px] font-bold leading-none ${color}`}>
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="relative overflow-hidden"
      style={{ background: "rgba(8,10,24,0.8)", borderTop: "1px solid rgba(123,110,246,0.12)", borderBottom: "1px solid rgba(123,110,246,0.12)" }}>
      {/* Subtle gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(123,110,246,0.4) 30%, rgba(29,217,160,0.4) 70%, transparent)" }} />

      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`py-8 px-6 flex flex-col items-center text-center relative ${i < stats.length - 1 ? "border-r border-white/5" : ""}`}
            >
              <CountUp to={s.value} suffix={s.suffix} color={s.color} />
              <div className="font-mono text-[11px] font-bold text-text-primary mt-2 tracking-[0.12em]">{s.label}</div>
              <div className="text-[11px] text-text-muted mt-1">{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
