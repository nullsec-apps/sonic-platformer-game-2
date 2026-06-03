import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Skull, Trophy, Coins, Layers, Clock } from 'lucide-react';
import type { RunStats } from '../types';
import type { UseHighScores } from '../hooks/useHighScores';
import { SubmitScoreForm } from './SubmitScoreForm';
import { Scoreboard } from './Scoreboard';
import { formatScore, formatRings, formatTimeDecimal } from '../lib/scoreFormat';

interface GameOverScreenProps {
  stats: RunStats;
  board: UseHighScores;
  highlightId: string | null;
  onSubmitted: (id: string | null) => void;
  onRetry: () => void;
  onMenu: () => void;
}

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

export function GameOverScreen({
  stats,
  board,
  highlightId,
  onSubmitted,
  onRetry,
  onMenu,
}: GameOverScreenProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitted = (id: string | null) => {
    setSubmitted(true);
    onSubmitted(id);
  };

  const statItems: StatItem[] = [
    {
      icon: <Trophy size={14} strokeWidth={2.5} />,
      label: 'SCORE',
      value: formatScore(stats.score),
      color: '#ffcc00',
    },
    {
      icon: <Coins size={14} strokeWidth={2.5} />,
      label: 'RINGS',
      value: formatRings(stats.rings),
      color: '#00b4ff',
    },
    {
      icon: <Layers size={14} strokeWidth={2.5} />,
      label: 'ZONE',
      value: String(stats.levelReached),
      color: '#fdf6e3',
    },
    {
      icon: <Clock size={14} strokeWidth={2.5} />,
      label: 'TIME',
      value: formatTimeDecimal(stats.timeSeconds),
      color: '#5a78c8',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#0a1a4a]/93 px-4 py-6"
    >
      <motion.div
        initial={{ scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="w-full max-w-lg border-4 border-[#0a1a4a] bg-[#142a6e] p-5 shadow-[8px_8px_0_rgba(0,0,0,0.45)] sm:p-7"
      >
        <div className="flex flex-col items-center gap-1.5">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 12, delay: 0.1 }}
            className="flex h-12 w-12 items-center justify-center border-4 border-[#e03b3b] bg-[#0a1a4a]"
          >
            {stats.completed ? (
              <Trophy size={22} className="text-[#ffcc00]" strokeWidth={2.5} />
            ) : (
              <Skull size={22} className="text-[#e03b3b]" strokeWidth={2.5} />
            )}
          </motion.div>
          <motion.h2
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="font-display text-xl text-[#ffcc00] drop-shadow-[2px_2px_0_#0a1a4a] sm:text-2xl"
          >
            {stats.completed ? 'YOU WIN!' : 'GAME OVER'}
          </motion.h2>
          <p className="font-body text-base uppercase tracking-wide text-[#5a78c8]">
            {stats.completed
              ? 'All zones cleared — true speedster!'
              : 'Gotta go faster next time...'}
          </p>
        </div>

        {/* stat grid */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statItems.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex flex-col items-center gap-1 border-2 border-[#0a1a4a] bg-[#0a1a4a] px-2 py-2.5"
            >
              <span style={{ color: s.color }}>{s.icon}</span>
              <span className="font-body text-[12px] uppercase tracking-wide text-[#5a78c8]">
                {s.label}
              </span>
              <span
                className="font-display text-[9px] tabular-nums"
                style={{ color: s.color }}
              >
                {s.value}
              </span>
            </motion.div>
          ))}
        </div>

        {/* submit score */}
        {!submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-6 border-t-2 border-dashed border-[#5a78c8] pt-5"
          >
            <SubmitScoreForm stats={stats} onSubmitted={handleSubmitted} />
          </motion.div>
        )}

        {/* scoreboard appears after submit */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <Scoreboard board={board} highlightId={highlightId} compact />
          </motion.div>
        )}

        {/* action buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="group flex min-h-[48px] flex-1 items-center justify-center gap-2 border-4 border-[#0a1a4a] bg-[#ffcc00] px-4 py-3 font-display text-[9px] text-[#0a1a4a] shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#ffd83a] hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:text-[10px]"
          >
            <RotateCcw
              size={15}
              strokeWidth={2.5}
              className="transition-transform duration-200 group-hover:-rotate-180"
            />
            RETRY
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="group flex min-h-[48px] flex-1 items-center justify-center gap-2 border-4 border-[#0a1a4a] bg-[#1a6ad6] px-4 py-3 font-display text-[9px] text-[#fdf6e3] shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#2e80e8] hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:text-[10px]"
          >
            <Home size={15} strokeWidth={2.5} />
            MENU
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default GameOverScreen;
