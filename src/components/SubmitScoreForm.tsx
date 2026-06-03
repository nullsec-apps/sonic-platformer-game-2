import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, AlertTriangle, WifiOff, Loader2 } from 'lucide-react';
import type { RunStats } from '../types';
import { useSubmitScore } from '../hooks/useSubmitScore';
import { sanitizeInitials, formatScore } from '../lib/scoreFormat';
import { cn } from '../lib/utils';

interface SubmitScoreFormProps {
  stats: RunStats;
  onSubmitted?: (id: string | null) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function cycleLetter(current: string, dir: 1 | -1): string {
  const idx = ALPHABET.indexOf(current);
  const next = (idx + dir + 26) % 26;
  return ALPHABET[next];
}

export function SubmitScoreForm({ stats, onSubmitted }: SubmitScoreFormProps) {
  const { status, error, submittedId, submit } = useSubmitScore();
  const [letters, setLetters] = useState<string[]>(['A', 'A', 'A']);
  const [activeSlot, setActiveSlot] = useState(0);

  const change = useCallback((slot: number, dir: 1 | -1) => {
    setLetters((prev) => {
      const next = [...prev];
      next[slot] = cycleLetter(next[slot], dir);
      return next;
    });
    setActiveSlot(slot);
  }, []);

  // Keyboard entry while the form is focused.
  useEffect(() => {
    if (status === 'success') return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/^[a-zA-Z]$/.test(k)) {
        e.stopPropagation();
        setLetters((prev) => {
          const next = [...prev];
          next[activeSlot] = k.toUpperCase();
          return next;
        });
        setActiveSlot((s) => Math.min(s + 1, 2));
      } else if (k === 'ArrowUp') {
        change(activeSlot, 1);
      } else if (k === 'ArrowDown') {
        change(activeSlot, -1);
      } else if (k === 'ArrowLeft') {
        setActiveSlot((s) => Math.max(0, s - 1));
      } else if (k === 'ArrowRight') {
        setActiveSlot((s) => Math.min(2, s + 1));
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activeSlot, change, status]);

  const handleSubmit = useCallback(async () => {
    const name = sanitizeInitials(letters.join(''));
    const res = await submit(name, stats);
    if (res.ok) onSubmitted?.(res.id);
  }, [letters, stats, submit, onSubmitted]);

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2 border-4 border-[#0a1a4a] bg-[#142a6e] px-4 py-4 shadow-[4px_4px_0_rgba(0,0,0,0.4)]"
      >
        <div className="flex h-10 w-10 items-center justify-center border-4 border-[#ffcc00] bg-[#1a6ad6]">
          <Check size={20} className="text-[#ffcc00]" strokeWidth={3} />
        </div>
        <p className="font-display text-[10px] text-[#ffcc00]">SCORE SAVED!</p>
        <p className="font-body text-[14px] uppercase tracking-wide text-[#fdf6e3]">
          {letters.join('')} &mdash; {formatScore(stats.score)}
        </p>
      </motion.div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-display text-[9px] text-[#00b4ff] sm:text-[10px]">ENTER YOUR INITIALS</p>

      <div className="flex items-center gap-2 sm:gap-3">
        {letters.map((letter, slot) => (
          <div key={slot} className="flex flex-col items-center gap-1">
            <button
              type="button"
              aria-label="Letter up"
              onClick={() => change(slot, 1)}
              disabled={submitting}
              className="flex h-7 w-9 items-center justify-center border-2 border-[#0a1a4a] bg-[#1a6ad6] text-[#fdf6e3] transition-all duration-150 hover:bg-[#2e80e8] active:translate-y-0.5 disabled:opacity-50"
            >
              <ChevronUp size={16} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlot(slot)}
              className={cn(
                'flex h-12 w-9 items-center justify-center border-4 bg-[#0a1a4a] font-display text-base text-[#ffcc00] transition-colors sm:w-11 sm:text-lg',
                activeSlot === slot
                  ? 'border-[#ffcc00] shadow-[0_0_8px_rgba(255,204,0,0.5)]'
                  : 'border-[#5a78c8]'
              )}
            >
              <motion.span key={letter} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {letter}
              </motion.span>
            </button>
            <button
              type="button"
              aria-label="Letter down"
              onClick={() => change(slot, -1)}
              disabled={submitting}
              className="flex h-7 w-9 items-center justify-center border-2 border-[#0a1a4a] bg-[#1a6ad6] text-[#fdf6e3] transition-all duration-150 hover:bg-[#2e80e8] active:translate-y-0.5 disabled:opacity-50"
            >
              <ChevronDown size={16} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>

      {(status === 'error' || status === 'offline') && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 font-body text-[13px] uppercase tracking-wide text-[#e03b3b]"
        >
          {status === 'offline' ? <WifiOff size={14} /> : <AlertTriangle size={14} />}
          {error || 'SUBMIT FAILED'}
        </motion.p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="group flex items-center gap-2 border-4 border-[#0a1a4a] bg-[#ffcc00] px-5 py-2.5 font-display text-[10px] text-[#0a1a4a] shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#ffd83a] hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-70 sm:text-[11px]"
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            SAVING
          </>
        ) : (
          'SUBMIT SCORE'
        )}
      </button>
      {submittedId && status !== 'success' && null}
    </div>
  );
}

export default SubmitScoreForm;
