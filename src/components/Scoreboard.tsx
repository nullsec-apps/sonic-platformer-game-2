import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, WifiOff, AlertTriangle } from 'lucide-react';
import type { UseHighScores } from '../hooks/useHighScores';
import { formatScore, formatRings, ordinal } from '../lib/scoreFormat';
import { cn } from '../lib/utils';

interface ScoreboardProps {
  board: UseHighScores;
  highlightId?: string | null;
  compact?: boolean;
  className?: string;
}

const RANK_COLORS = ['#ffcc00', '#c0d4ff', '#e09b4b'];

export function Scoreboard({ board, highlightId, compact = false, className }: ScoreboardProps) {
  const { scores, status, refresh } = board;

  return (
    <div
      className={cn(
        'border-4 border-[#0a1a4a] bg-[#142a6e] shadow-[6px_6px_0_rgba(0,0,0,0.4)]',
        className
      )}
    >
      <div className="flex items-center justify-between border-b-4 border-[#0a1a4a] bg-[#0a1a4a] px-2.5 py-2 sm:px-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[#ffcc00]" strokeWidth={2.5} />
          <h3 className="font-display text-[9px] text-[#ffcc00] sm:text-[10px]">HIGH SCORES</h3>
          {(status === 'offline' || status === 'error') && (
            <span className="flex items-center gap-1 font-body text-[12px] uppercase text-[#5a78c8]">
              {status === 'offline' ? (
                <WifiOff size={12} />
              ) : (
                <AlertTriangle size={12} className="text-[#e03b3b]" />
              )}
              {status === 'offline' ? 'offline' : 'demo'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={status === 'loading'}
          aria-label="Refresh scoreboard"
          className="group flex items-center gap-1 border-2 border-[#5a78c8] px-1.5 py-0.5 font-body text-[12px] uppercase text-[#fdf6e3] transition-colors duration-200 hover:border-[#ffcc00] hover:text-[#ffcc00] disabled:opacity-50"
        >
          <RefreshCw
            size={12}
            className={cn('transition-transform', status === 'loading' && 'animate-spin')}
          />
        </button>
      </div>

      <div className="max-h-[40vh] overflow-y-auto">
        {/* loading skeleton */}
        {status === 'loading' && (
          <div className="space-y-1.5 p-2.5">
            {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
              <div
                key={i}
                className="h-7 animate-pulse border-2 border-[#0a1a4a] bg-[#1a3380]"
                style={{ opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        )}

        {/* empty */}
        {status === 'empty' && (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <Trophy size={28} className="text-[#5a78c8]" strokeWidth={1.5} />
            <p className="font-body text-[14px] uppercase tracking-wide text-[#5a78c8]">
              No scores yet — be the first to set a record!
            </p>
          </div>
        )}

        {/* rows */}
        {(status === 'ready' || status === 'offline' || status === 'error') && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0a1a4a]/60">
                <th className="px-2 py-1 text-left font-display text-[7px] text-[#5a78c8] sm:text-[8px]">
                  #
                </th>
                <th className="px-1 py-1 text-left font-display text-[7px] text-[#5a78c8] sm:text-[8px]">
                  NAME
                </th>
                <th className="px-1 py-1 text-right font-display text-[7px] text-[#5a78c8] sm:text-[8px]">
                  SCORE
                </th>
                {!compact && (
                  <th className="px-1 py-1 text-right font-display text-[7px] text-[#5a78c8] sm:text-[8px]">
                    RINGS
                  </th>
                )}
                <th className="px-2 py-1 text-right font-display text-[7px] text-[#5a78c8] sm:text-[8px]">
                  ZONE
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {scores.map((s, i) => {
                  const highlight = highlightId && s.id === highlightId;
                  return (
                    <motion.tr
                      key={s.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                      className={cn(
                        'border-t-2 border-[#0a1a4a] transition-colors',
                        i % 2 === 0 ? 'bg-[#142a6e]' : 'bg-[#16307a]',
                        highlight && 'animate-pulse bg-[#1a6ad6] ring-2 ring-inset ring-[#ffcc00]',
                        s.__example && 'opacity-60'
                      )}
                    >
                      <td className="px-2 py-1.5">
                        <span
                          className="font-display text-[8px] sm:text-[9px]"
                          style={{ color: RANK_COLORS[i] ?? '#5a78c8' }}
                        >
                          {ordinal(i + 1)}
                        </span>
                      </td>
                      <td className="px-1 py-1.5">
                        <span className="font-display text-[9px] tracking-widest text-[#fdf6e3] sm:text-[10px]">
                          {s.player_name}
                        </span>
                      </td>
                      <td className="px-1 py-1.5 text-right">
                        <span className="font-display text-[9px] tabular-nums text-[#ffcc00] sm:text-[10px]">
                          {formatScore(s.score)}
                        </span>
                      </td>
                      {!compact && (
                        <td className="px-1 py-1.5 text-right">
                          <span className="font-body text-[14px] tabular-nums text-[#00b4ff]">
                            {formatRings(s.rings_collected)}
                          </span>
                        </td>
                      )}
                      <td className="px-2 py-1.5 text-right">
                        <span className="font-body text-[14px] tabular-nums text-[#5a78c8]">
                          {s.level_reached}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Scoreboard;
