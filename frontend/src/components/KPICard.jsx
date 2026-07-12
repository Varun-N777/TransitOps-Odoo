import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

const KPICard = ({ title, value, icon: Icon, color, subtitle, delay = 0 }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const shouldReduceMotion = useReducedMotion();

  const rotateXRaw = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateYRaw = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const rotateX = shouldReduceMotion ? 0 : rotateXRaw;
  const rotateY = shouldReduceMotion ? 0 : rotateYRaw;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.23, 1, 0.32, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={shouldReduceMotion ? undefined : handleMouseMove}
      onMouseLeave={shouldReduceMotion ? undefined : handleMouseLeave}
      className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] cursor-pointer"
    >
      <div style={{ transform: "translateZ(40px)" }}>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>
        <h3 className="text-4xl font-extrabold text-slate-800 mt-2 tracking-tighter">{value}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-2 font-medium">{subtitle}</p>}
      </div>
      <div 
        style={{ transform: "translateZ(60px)" }}
        className={`p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 shadow-md ${color || 'text-blue-500'}`}
      >
        <Icon size={32} />
      </div>
    </motion.div>
  );
};

export default KPICard;
