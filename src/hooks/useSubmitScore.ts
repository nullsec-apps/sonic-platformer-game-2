import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RunStats } from '../types';
import { sanitizeInitials } from '../lib/scoreFormat';

const PROJECT_ID =
  (typeof window !== 'undefined' && (window as any).__NULLSEC__?.projectId) || 'local';
const TABLE = `app_${PROJECT_ID}_scores`;

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error' | 'offline';

export interface SubmitResult {
  id: string | null;
  ok: boolean;
}

export interface UseSubmitScore {
  status: SubmitStatus;
  error: string | null;
  submittedId: string | null;
  submit: (name: string, stats: RunStats) => Promise<SubmitResult>;
  reset: () => void;
}

/**
 * Inserts a leaderboard entry into Supabase with loading/success/error/offline handling.
 * Returns the created row id (used to highlight the entry on the scoreboard).
 */
export function useSubmitScore(): UseSubmitScore {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setSubmittedId(null);
  }, []);

  const submit = useCallback(
    async (name: string, stats: RunStats): Promise<SubmitResult> => {
      const playerName = sanitizeInitials(name);

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setStatus('offline');
        setError('YOU ARE OFFLINE — SCORE NOT SAVED');
        return { id: null, ok: false };
      }

      setStatus('submitting');
      setError(null);

      try {
        const { data, error: insertErr } = await supabase
          .from(TABLE)
          .insert({
            player_name: playerName,
            score: Math.max(0, Math.floor(stats.score)),
            rings_collected: Math.max(0, Math.floor(stats.rings)),
            level_reached: Math.max(1, Math.floor(stats.levelReached)),
            time_seconds: Math.max(0, Math.round(stats.timeSeconds)),
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        const id = (data?.id as string) ?? null;
        setSubmittedId(id);
        setStatus('success');
        return { id, ok: true };
      } catch (e: any) {
        setStatus('error');
        setError((e?.message as string) || 'SUBMIT FAILED — TRY AGAIN');
        return { id: null, ok: false };
      }
    },
    []
  );

  return { status, error, submittedId, submit, reset };
}
