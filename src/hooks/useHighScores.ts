import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScoreEntry } from '../types';
import { supabase, subscribeToTable } from '../lib/supabase';

// Fetches the top arcade scores from app_{projectId}_scores ordered by score
// DESC, subscribes to realtime INSERTs so the board live-updates, and falls
// back to clearly-labeled example rows when empty or offline. Example rows are
// display-only (flagged __example) and are never persisted.

const PROJECT_ID =
  (typeof window !== 'undefined' && (window as any).__NULLSEC__?.projectId) ||
  'default';
const TABLE = `app_${PROJECT_ID}_scores`;
const LIMIT = 10;

const EXAMPLE_ROWS: ScoreEntry[] = [
  { id: 'ex-1', player_name: 'SON', score: 9999, rings_collected: 142, level_reached: 3, time_seconds: 84, created_at: new Date().toISOString(), __example: true },
  { id: 'ex-2', player_name: 'TLS', score: 8400, rings_collected: 121, level_reached: 3, time_seconds: 97, created_at: new Date().toISOString(), __example: true },
  { id: 'ex-3', player_name: 'KNX', score: 7100, rings_collected: 108, level_reached: 2, time_seconds: 112, created_at: new Date().toISOString(), __example: true },
  { id: 'ex-4', player_name: 'AMY', score: 6250, rings_collected: 96, level_reached: 2, time_seconds: 128, created_at: new Date().toISOString(), __example: true },
  { id: 'ex-5', player_name: 'EGG', score: 4800, rings_collected: 74, level_reached: 2, time_seconds: 140, created_at: new Date().toISOString(), __example: true },
];

export type BoardStatus = 'loading' | 'ready' | 'empty' | 'error' | 'offline';

export interface UseHighScores {
  scores: ScoreEntry[];
  status: BoardStatus;
  isExample: boolean;
  refresh: () => void;
}

export function useHighScores(autoSubscribe = true): UseHighScores {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [status, setStatus] = useState<BoardStatus>('loading');
  const [isExample, setIsExample] = useState(false);
  const mounted = useRef(true);

  const fetchScores = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (!mounted.current) return;
      setScores(EXAMPLE_ROWS);
      setIsExample(true);
      setStatus('offline');
      return;
    }
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(LIMIT);
      if (!mounted.current) return;
      if (error) {
        setScores(EXAMPLE_ROWS);
        setIsExample(true);
        setStatus('error');
        return;
      }
      if (!data || data.length === 0) {
        setScores(EXAMPLE_ROWS);
        setIsExample(true);
        setStatus('empty');
        return;
      }
      setScores(data as ScoreEntry[]);
      setIsExample(false);
      setStatus('ready');
    } catch {
      if (!mounted.current) return;
      setScores(EXAMPLE_ROWS);
      setIsExample(true);
      setStatus('error');
    }
  }, []);

  const refresh = useCallback(() => {
    setStatus('loading');
    fetchScores();
  }, [fetchScores]);

  useEffect(() => {
    mounted.current = true;
    fetchScores();
    return () => {
      mounted.current = false;
    };
  }, [fetchScores]);

  useEffect(() => {
    if (!autoSubscribe) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToTable(
        'scores',
        () => {
          // On any new insert, re-fetch the ranked top 10.
          fetchScores();
        },
        { event: 'INSERT' }
      );
    } catch {
      unsub = undefined;
    }
    return () => {
      if (unsub) unsub();
    };
  }, [autoSubscribe, fetchScores]);

  useEffect(() => {
    const onOnline = () => refresh();
    const onOffline = () => {
      setScores(EXAMPLE_ROWS);
      setIsExample(true);
      setStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refresh]);

  return { scores, status, isExample, refresh };
}
