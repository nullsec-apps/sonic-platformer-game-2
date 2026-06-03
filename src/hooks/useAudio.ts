import { useCallback, useEffect, useRef, useState } from 'react';

// Procedural retro SFX via the Web Audio API + a simple looping chiptune bed.
// No audio files needed; everything is synthesized so it always works offline.

type Sfx = 'ring' | 'jump' | 'spindash' | 'spinrelease' | 'pop' | 'hurt' | 'ringloss' | 'spring' | 'goal' | 'select';

interface UseAudio {
  muted: boolean;
  toggleMute: () => void;
  play: (sfx: Sfx) => void;
  startMusic: (zone: number) => void;
  stopMusic: () => void;
  unlock: () => void;
}

const STORAGE_KEY = 'sonic-speedway-muted';

export function useAudio(): UseAudio {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicRef = useRef<{ stop: () => void } | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const ensureCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        const ctx = new AC();
        const master = ctx.createGain();
        master.gain.value = 0.35;
        master.connect(ctx.destination);
        ctxRef.current = ctx;
        masterRef.current = master;
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const unlock = useCallback(() => {
    ensureCtx();
  }, [ensureCtx]);

  const beep = useCallback(
    (
      freq: number,
      durMs: number,
      type: OscillatorType,
      vol: number,
      sweepTo?: number
    ) => {
      if (mutedRef.current) return;
      const ctx = ensureCtx();
      const master = masterRef.current;
      if (!ctx || !master) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (sweepTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), now + durMs / 1000);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + durMs / 1000 + 0.02);
    },
    [ensureCtx]
  );

  const play = useCallback(
    (sfx: Sfx) => {
      switch (sfx) {
        case 'ring':
          beep(988, 70, 'sine', 0.25);
          setTimeout(() => beep(1319, 90, 'sine', 0.22), 55);
          break;
        case 'jump':
          beep(440, 140, 'square', 0.18, 760);
          break;
        case 'spindash':
          beep(180, 90, 'sawtooth', 0.16, 360);
          break;
        case 'spinrelease':
          beep(660, 180, 'sawtooth', 0.2, 220);
          break;
        case 'pop':
          beep(520, 80, 'square', 0.2, 180);
          setTimeout(() => beep(880, 60, 'triangle', 0.18), 50);
          break;
        case 'hurt':
          beep(200, 240, 'sawtooth', 0.24, 90);
          break;
        case 'ringloss':
          beep(700, 200, 'triangle', 0.2, 280);
          break;
        case 'spring':
          beep(300, 160, 'sine', 0.22, 900);
          break;
        case 'goal':
          [523, 659, 784, 1047].forEach((f, i) =>
            setTimeout(() => beep(f, 180, 'square', 0.2), i * 130)
          );
          break;
        case 'select':
          beep(880, 60, 'square', 0.18);
          break;
      }
    },
    [beep]
  );

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.stop();
      musicRef.current = null;
    }
  }, []);

  const startMusic = useCallback(
    (zone: number) => {
      stopMusic();
      if (mutedRef.current) return;
      const ctx = ensureCtx();
      const master = masterRef.current;
      if (!ctx || !master) return;

      const scales = [
        [262, 294, 330, 392, 440, 392, 330, 294],
        [220, 262, 294, 330, 392, 330, 294, 262],
        [294, 330, 392, 466, 523, 466, 392, 330],
      ];
      const scale = scales[zone % scales.length];
      const bassRoot = [131, 110, 147][zone % 3];

      const musicGain = ctx.createGain();
      musicGain.gain.value = 0.12;
      musicGain.connect(master);

      let step = 0;
      const stepMs = 220;
      const id = window.setInterval(() => {
        if (mutedRef.current) return;
        const now = ctx.currentTime;
        const note = scale[step % scale.length];
        const lead = ctx.createOscillator();
        const lg = ctx.createGain();
        lead.type = 'square';
        lead.frequency.value = note;
        lg.gain.setValueAtTime(0.0001, now);
        lg.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
        lg.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        lead.connect(lg);
        lg.connect(musicGain);
        lead.start(now);
        lead.stop(now + 0.2);

        if (step % 2 === 0) {
          const bass = ctx.createOscillator();
          const bg = ctx.createGain();
          bass.type = 'triangle';
          bass.frequency.value = bassRoot;
          bg.gain.setValueAtTime(0.0001, now);
          bg.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
          bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
          bass.connect(bg);
          bg.connect(musicGain);
          bass.start(now);
          bass.stop(now + 0.34);
        }
        step += 1;
      }, stepMs);

      musicRef.current = {
        stop: () => {
          window.clearInterval(id);
          try {
            musicGain.disconnect();
          } catch {}
        },
      };
    },
    [ensureCtx, stopMusic]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      if (next) stopMusic();
      return next;
    });
  }, [stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, [stopMusic]);

  return { muted, toggleMute, play, startMusic, stopMusic, unlock };
}
