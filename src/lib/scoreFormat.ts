// Formatting + scoring helpers for SONIC SPEEDWAY.

import { TIME_BONUS_PER_SECOND, RING_BONUS_PER_RING } from './physicsConstants';

/** Zero-pad a numeric counter to a fixed width (rings: 3, score: 6 typically). */
export function padNumber(value: number, width: number): string {
  const safe = Math.max(0, Math.floor(value));
  const s = String(safe);
  if (s.length >= width) return s;
  return '0'.repeat(width - s.length) + s;
}

/** Rings counter, classic 3-digit padding (000). */
export function formatRings(rings: number): string {
  return padNumber(rings, 3);
}

/** Score counter, 6-digit padding (000000). */
export function formatScore(score: number): string {
  return padNumber(score, 6);
}

/** Format seconds as MM:SS (clamped at 9:59 classic Sonic style if needed). */
export function formatTime(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(t / 60);
  const seconds = t % 60;
  return `${minutes}:${padNumber(seconds, 2)}`;
}

/** Format seconds with decimals for results screens (e.g. 42.5s). */
export function formatTimeDecimal(seconds: number): string {
  return `${Math.max(0, seconds).toFixed(1)}s`;
}

/** Compute the time bonus awarded at act clear. Faster finishes => bigger bonus. */
export function timeBonus(timeRemaining: number): number {
  return Math.max(0, Math.floor(timeRemaining)) * TIME_BONUS_PER_SECOND;
}

/** Compute the ring bonus awarded at act clear. */
export function ringBonus(rings: number): number {
  return Math.max(0, Math.floor(rings)) * RING_BONUS_PER_RING;
}

/** Total act-clear bonus. */
export function actClearBonus(timeRemaining: number, rings: number): number {
  return timeBonus(timeRemaining) + ringBonus(rings);
}

/**
 * Sanitize player initials: uppercase A-Z only, exactly 3 chars padded with 'A'.
 * Classic arcade entry. Strips anything non-alphabetic.
 */
export function sanitizeInitials(input: string): string {
  const cleaned = (input || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  return (cleaned + 'AAA').slice(0, 3);
}

/** Compact large-number formatting (e.g. 12.3K) for stat displays. */
export function formatCompact(value: number): string {
  const n = Math.floor(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Ordinal rank suffix for scoreboard (1st, 2nd, 3rd...). */
export function ordinal(rank: number): string {
  const j = rank % 10;
  const k = rank % 100;
  if (j === 1 && k !== 11) return `${rank}ST`;
  if (j === 2 && k !== 12) return `${rank}ND`;
  if (j === 3 && k !== 13) return `${rank}RD`;
  return `${rank}TH`;
}
