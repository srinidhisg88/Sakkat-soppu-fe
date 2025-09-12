import { useEffect, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

// Use Vite to resolve the logo asset
const logoUrl = new URL('../../logo_final.jpg', import.meta.url).href;

export function SplashScreen({ duration = 1200, onFinish }: { duration?: number; onFinish?: () => void }) {
  const [show, setShow] = useState(true);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const REVEAL_MS = 800;
    const holdTimer = setTimeout(() => setReveal(true), duration);
    const doneTimer = setTimeout(() => {
      setShow(false);
      onFinish?.();
    }, duration + REVEAL_MS + 200);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onFinish]);

  // No hero alignment; splash logo stays centered and disappears

  if (!show) return null;

  const overlayStyle: CSSProperties = {
    backgroundColor: 'white',
    WebkitMaskImage:
      'radial-gradient(circle at 50% 50%, transparent var(--r), black calc(var(--r) + 1px))',
    maskImage:
      'radial-gradient(circle at 50% 50%, transparent var(--r), black calc(var(--r) + 1px))',
    willChange: 'mask-image, -webkit-mask-image',
    ['--r']: '0vmax',
  } as unknown as CSSProperties;

  const animateVarsCollapsed: Record<'--r', string> = { '--r': '0vmax' };
  const animateVarsExpanded: Record<'--r', string> = { '--r': '120vmax' };

  return (
    <motion.div className="fixed inset-0 z-[1000] flex items-center justify-center bg-transparent">
      {/* Single white overlay using mask: transparent circle grows to reveal content */}
      <motion.div
        className="absolute inset-0 z-10"
        style={overlayStyle}
        animate={reveal ? animateVarsExpanded : animateVarsCollapsed}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Centered brand logo (shared element) */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: reveal ? 0 : 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="relative z-20 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white shadow p-2 overflow-hidden flex items-center justify-center"
      >
        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
      </motion.div>
    </motion.div>
  );
}

export default SplashScreen;
