import { useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RunStats } from '../types';

const PROJECT_ID =
  (typeof window !== 'undefined' && (window as any).__NULLSEC__?.projectId) || 'local';
const TABLE = `app_${PROJECT_ID}_runs`;

export interface UseRunTelemetry {
  logRun: (stats: RunStats) => Promise<void>;
}

/**
 * Logs per-session telemetry to app_{projectId}_runs at game end.
 * Fire-and-forget; never blocks gameplay UI. Deduped per run id.
 */
export function useRunTelemetry(): UseRunTelemetry {
  const lastLogged = useRef<string | null>(null);

  const logRun = useCallback(async (stats: RunStats) => {
    // Dedup identical runs in the same session.
    const sig = `${stats.score}-${stats.levelReached}-${stats.timeSeconds}-${stats.deaths}-${stats.completed}`;
    if (lastLogged.current === sig) return;
    lastLogged.current = sig;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    try {
      await supabase.from(TABLE).insert({
        score: Math.max(0, Math.floor(stats.score)),
        level_reached: Math.max(1, Math.floor(stats.levelReached)),
        enemies_defeated: Math.max(0, Math.floor(stats.enemiesDefeated)),
        deaths: Math.max(0, Math.floor(stats.deaths)),
        completed: !!stats.completed,
        meta: {
          rings: Math.max(0, Math.floor(stats.rings)),
          time_seconds: Math.max(0, Math.round(stats.timeSeconds)),
        },
      });
    } catch {
      // Telemetry is best-effort; swallow errors silently.
    }
  }, []);

  return { logRun };
}
