import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { formatRings, formatScore, formatTime } from '../lib/scoreFormat';
import { cn } from '../lib/utils';

interface HUDProps {
  rings: number;
  score: number;
  timeRemaining: number;
  lives: number;
  zoneLabel: string;
}

function Sparkle({ id }: { id: number }) {
  return (
    <motion.span
      key={id}
      initial={{ opacity: 1, scale: 0.4, y: 0, x: 0 }}
      animate={{ opacity: 0, scale: 1.4, y: -10, x: (id % 2 === 0 ? 1 : -1) * 8 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 bg-[#ffcc00]"
      style={{ boxShadow: '0 0 4px #ffcc00' }}
    />
  );
}

export function HUD({ rings, score, timeRemaining, lives, zoneLabel }: HUDProps) {
  const [bump, setBump] = useState(false);
  const [sparkles, setSparkles] = useState<number[]>([]);
  const prevRings = useRef(rings);
  const sparkleId = useRef(0);
  const timeLow = timeRemaining <= 30;

  useEffect(() => {
    if (rings > prevRings.current) {
      setBump(true);
      const ids = [sparkleId.current++, sparkleId.current++, sparkleId.current++];
      setSparkles((s) => [...s, ...ids]);
      const t1 = window.setTimeout(() => setBump(false), 160);
      const t2 = window.setTimeout(
        () => setSparkles((s) => s.filter((x) => !ids.includes(x))),
        500
      );
      prevRings.current = rings;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prevRings.current = rings;
  }, [rings]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="flex items-stretch justify-between gap-2 border-b-4 border-[#0a1a4a] bg-[#142a6e]/95 px-2 py-1.5 shadow-[0_4px_0_rgba(0,0,0,0.4)] sm:px-4 sm:py-2">
        {/* RINGS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex h-6 w-6 items-center justify-center sm:h-7 sm:w-7">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              className="h-5 w-5 rounded-full border-[3px] border-[#ffcc00] bg-[#1a6ad6] sm:h-6 sm:w-6"
              style={{ boxShadow: '0 0 6px rgba(255,204,0,0.6)' }}
            />
            <AnimatePresence>
              {sparkles.map((id) => (
                <Sparkle key={id} id={id} />
              ))}
            </AnimatePresence>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[7px] text-[#ffcc00] sm:text-[8px]">RINGS</span>
            <motion.span
              animate={bump ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-0.5 font-display text-[11px] tabular-nums text-[#fdf6e3] drop-shadow-[1px_1px_0_#0a1a4a] sm:text-sm"
            >
              {formatRings(rings)}
            </motion.span>
          </div>
        </div>

        {/* SCORE */}
        <div className="flex flex-col items-center leading-none">
          <span className="font-display text-[7px] text-[#00b4ff] sm:text-[8px]">SCORE</span>
          <span className="mt-0.5 font-display text-[11px] tabular-nums text-[#fdf6e3] drop-shadow-[1px_1px_0_#0a1a4a] sm:text-sm">
            {formatScore(score)}
          </span>
          <span className="mt-0.5 hidden font-body text-[12px] uppercase tracking-wide text-[#5a78c8] sm:block">
            {zoneLabel}
          </span>
        </div>

        {/* TIME + LIVES */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-end leading-none">
            <span
              className={cn(
                'font-display text-[7px] sm:text-[8px]',
                timeLow ? 'text-[#e03b3b]' : 'text-[#ffcc00]'
              )}
            >
              TIME
            </span>
            <motion.span
              animate={timeLow ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
              transition={{ duration: 0.6, repeat: timeLow ? Infinity : 0 }}
              className={cn(
                'mt-0.5 font-display text-[11px] tabular-nums drop-shadow-[1px_1px_0_#0a1a4a] sm:text-sm',
                timeLow ? 'text-[#e03b3b]' : 'text-[#fdf6e3]'
              )}
            >
              {formatTime(timeRemaining)}
            </motion.span>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className="font-display text-[7px] text-[#00b4ff] sm:text-[8px]">LIVES</span>
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: Math.max(0, Math.min(lives, 5)) }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Heart
                    size={12}
                    strokeWidth={2.5}
                    className="fill-[#e03b3b] text-[#0a1a4a]"
                  />
                </motion.span>
              ))}
              {lives > 5 && (
                <span className="ml-0.5 font-display text-[8px] text-[#fdf6e3]">x{lives}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center sm:hidden">
        <span className="mt-0.5 rounded-none border-2 border-[#0a1a4a] bg-[#142a6e]/90 px-2 py-0.5 font-body text-[12px] uppercase tracking-wide text-[#5a78c8]">
          {zoneLabel}
        </span>
      </div>
    </div>
  );
}

export default HUD;
