import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ControlsHint } from './ControlsHint';
import { formatScore } from '../lib/scoreFormat';
import { getLevel, hasNextLevel } from '../lib/levels';

interface LevelTransitionProps {
  currentLevel: number;
  timeBonus: number;
  ringBonus: number;
  totalBonus: number;
  onContinue: () => void;
}

/**
 * Between-stage interstitial: ACT CLEAR with bonus tally counting up,
 * next zone banner, control reminder, and a foot-tap idle Sonic.
 */
export function LevelTransition({
  currentLevel,
  timeBonus,
  ringBonus,
  totalBonus,
  onContinue,
}: LevelTransitionProps) {
  const [tally, setTally] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);

  const next = hasNextLevel(currentLevel);
  const nextLevel = next ? getLevel(currentLevel + 1) : null;
  const progress = totalBonus > 0 ? Math.min(100, (tally / totalBonus) * 100) : 100;

  // count-up tally animation
  useEffect(() => {
    let start: number | null = null;
    const dur = Math.min(1600, 600 + totalBonus / 4);
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setTally(Math.floor(eased * totalBonus));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTally(totalBonus);
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [totalBonus]);

  // allow continue on key/click after tally
  useEffect(() => {
    if (!done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') onContinue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#0a1a4a]/92 px-4"
    >
      <motion.div
        initial={{ scale: 0.85, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="w-full max-w-md border-4 border-[#0a1a4a] bg-[#142a6e] p-5 shadow-[8px_8px_0_rgba(0,0,0,0.45)] sm:p-7"
      >
        <div className="flex flex-col items-center gap-1">
          <motion.h2
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
            className="font-display text-xl text-[#ffcc00] drop-shadow-[2px_2px_0_#0a1a4a] sm:text-2xl"
          >
            ACT CLEAR
          </motion.h2>
          <div className="flex items-center gap-2 font-body text-base uppercase tracking-wider text-[#5a78c8]">
            <Flag size={14} className="text-[#00b4ff]" strokeWidth={2.5} />
            ZONE {currentLevel + 1} COMPLETE
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <BonusRow label="TIME BONUS" value={timeBonus} color="#00b4ff" />
          <BonusRow label="RING BONUS" value={ringBonus} color="#ffcc00" />
          <div className="my-2 h-0.5 bg-[#0a1a4a]" />
          <div className="flex items-center justify-between border-2 border-[#ffcc00] bg-[#0a1a4a] px-3 py-2">
            <span className="font-display text-[9px] text-[#fdf6e3] sm:text-[10px]">TOTAL</span>
            <motion.span
              key={tally}
              className="font-display text-base tabular-nums text-[#ffcc00] sm:text-lg"
            >
              {formatScore(tally)}
            </motion.span>
          </div>
          <Progress
            value={progress}
            className="h-2 border-2 border-[#0a1a4a] bg-[#0a1a4a]"
          />
        </div>

        {next && nextLevel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: done ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-5 border-2 border-[#5a78c8] bg-[#0a1a4a] px-3 py-2.5 text-center"
          >
            <p className="font-body text-base uppercase tracking-wide text-[#5a78c8]">NEXT</p>
            <motion.p
              animate={done ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="font-display text-[10px] text-[#00b4ff] sm:text-[11px]"
            >
              LEVEL {nextLevel.index + 1}: {nextLevel.zoneName.toUpperCase()}
            </motion.p>
          </motion.div>
        )}

        <ControlsHint className="mt-5" variant="compact" animate={false} />

        <button
          type="button"
          onClick={onContinue}
          disabled={!done}
          className="group mt-5 flex w-full items-center justify-center gap-2 border-4 border-[#0a1a4a] bg-[#ffcc00] px-5 py-3 font-display text-[10px] text-[#0a1a4a] shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#ffd83a] hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-50 sm:text-[11px]"
        >
          {next ? 'NEXT ZONE' : 'FINISH RUN'}
        </button>
      </motion.div>
    </motion.div>
  );
}

function BonusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-base uppercase tracking-wide text-[#fdf6e3]">{label}</span>
      <span className="font-display text-[9px] tabular-nums" style={{ color }}>
        {formatScore(value)}
      </span>
    </div>
  );
}

export default LevelTransition;
