import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Zap, Gamepad2 } from 'lucide-react';
import { TitleDemoLoop } from './TitleDemoLoop';
import { Scoreboard } from './Scoreboard';
import { ControlsHint } from './ControlsHint';
import type { UseHighScores } from '../hooks/useHighScores';
import { TOTAL_LEVELS } from '../lib/levels';

interface StartMenuProps {
  board: UseHighScores;
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
}

export function StartMenu({ board, muted, onToggleMute, onStart }: StartMenuProps) {
  // Press Start on Space/Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 overflow-y-auto bg-[#0a1a4a]"
    >
      {/* attract-mode demo loop fills the background */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <TitleDemoLoop className="h-full w-full object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a1a4a]/60 via-[#0a1a4a]/40 to-[#0a1a4a]/90" />

      {/* mute toggle */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center border-2 border-[#5a78c8] bg-[#142a6e] text-[#ffcc00] transition-colors duration-200 hover:border-[#ffcc00] active:translate-y-0.5"
      >
        {muted ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
      </button>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-10">
        {/* title */}
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-2 flex items-center gap-2">
            <Zap size={18} className="text-[#ffcc00]" strokeWidth={2.5} fill="#ffcc00" />
            <span className="font-body text-base uppercase tracking-[0.3em] text-[#00b4ff]">
              {TOTAL_LEVELS} ZONES
            </span>
            <Zap size={18} className="text-[#ffcc00]" strokeWidth={2.5} fill="#ffcc00" />
          </div>
          <h1
            className="font-display text-2xl leading-tight text-[#ffcc00] drop-shadow-[3px_3px_0_#0a1a4a] sm:text-4xl"
            style={{ textShadow: '3px 3px 0 #0a1a4a, 5px 5px 0 #00b4ff' }}
          >
            SONIC
            <br />
            SPEEDWAY
          </h1>
          <p className="mt-4 max-w-md font-body text-base uppercase leading-snug tracking-wide text-[#fdf6e3] sm:text-lg">
            Blast through loop-de-loops, smash badniks, and grab every ring before the clock runs
            out. Gotta go fast.
          </p>
        </motion.div>

        {/* PRESS START CTA */}
        <motion.button
          type="button"
          onClick={onStart}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.3 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="group mt-7 flex min-h-[56px] items-center gap-3 border-4 border-[#0a1a4a] bg-[#ffcc00] px-7 py-3.5 shadow-[6px_6px_0_rgba(0,0,0,0.45)] transition-shadow duration-150 hover:shadow-[3px_3px_0_rgba(0,0,0,0.45)]"
        >
          <Gamepad2 size={20} className="text-[#0a1a4a]" strokeWidth={2.5} />
          <motion.span
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            className="font-display text-sm text-[#0a1a4a] sm:text-base"
          >
            PRESS START
          </motion.span>
        </motion.button>

        {/* controls hint */}
        <ControlsHint className="mt-7" variant="full" />

        {/* scoreboard peek */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-7 w-full max-w-md"
        >
          <Scoreboard board={board} compact />
        </motion.div>

        <p className="mt-5 text-center font-body text-[13px] uppercase tracking-wide text-[#5a78c8]">
          A retro Sega-Genesis-era speed runner &middot; built for the arcade
        </p>
      </div>
    </motion.div>
  );
}

export default StartMenu;
