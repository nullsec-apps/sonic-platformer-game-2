import { useCallback, useEffect, useRef } from 'react';
import type { InputState } from '../types';

// Unified keyboard + virtual touch input. Tracks press duration for variable
// jump height and spin-dash charge. Returns a mutable ref read each fixed step.

export interface VirtualControls {
  setLeft: (down: boolean) => void;
  setRight: (down: boolean) => void;
  setJump: (down: boolean) => void;
  setCrouch: (down: boolean) => void;
}

export interface UseInput {
  inputRef: React.MutableRefObject<InputState>;
  virtual: VirtualControls;
  consumePause: () => boolean;
}

function freshInput(): InputState {
  return {
    left: false,
    right: false,
    jump: false,
    jumpHeldMs: 0,
    crouch: false,
    crouchHeldMs: 0,
    pause: false,
  };
}

export function useInput(enabled: boolean = true): UseInput {
  const inputRef = useRef<InputState>(freshInput());
  // Track separate keyboard vs virtual flags so neither clobbers the other.
  const kb = useRef({ left: false, right: false, jump: false, crouch: false });
  const vt = useRef({ left: false, right: false, jump: false, crouch: false });
  const pauseQueued = useRef(false);
  const lastTick = useRef(performance.now());
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const recompute = useCallback(() => {
    const i = inputRef.current;
    const now = performance.now();
    const dt = Math.min(64, now - lastTick.current);
    lastTick.current = now;

    const left = kb.current.left || vt.current.left;
    const right = kb.current.right || vt.current.right;
    const jump = kb.current.jump || vt.current.jump;
    const crouch = kb.current.crouch || vt.current.crouch;

    i.left = left;
    i.right = right;
    i.crouch = crouch;

    if (jump) {
      if (!i.jump) i.jumpHeldMs = 0;
      else i.jumpHeldMs += dt;
    } else {
      i.jumpHeldMs = 0;
    }
    i.jump = jump;

    if (crouch) {
      i.crouchHeldMs += dt;
    } else {
      i.crouchHeldMs = 0;
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      const code = e.code;
      let handled = true;
      switch (true) {
        case k === 'ArrowLeft' || code === 'KeyA':
          kb.current.left = true;
          break;
        case k === 'ArrowRight' || code === 'KeyD':
          kb.current.right = true;
          break;
        case k === 'ArrowDown' || code === 'KeyS':
          kb.current.crouch = true;
          break;
        case k === ' ' || code === 'Space' || k === 'ArrowUp' || code === 'KeyW':
          kb.current.jump = true;
          break;
        case k === 'Escape' || code === 'Escape' || code === 'KeyP':
          if (!e.repeat) pauseQueued.current = true;
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        recompute();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key;
      const code = e.code;
      let handled = true;
      switch (true) {
        case k === 'ArrowLeft' || code === 'KeyA':
          kb.current.left = false;
          break;
        case k === 'ArrowRight' || code === 'KeyD':
          kb.current.right = false;
          break;
        case k === 'ArrowDown' || code === 'KeyS':
          kb.current.crouch = false;
          break;
        case k === ' ' || code === 'Space' || k === 'ArrowUp' || code === 'KeyW':
          kb.current.jump = false;
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        recompute();
      }
    };
    const onBlur = () => {
      kb.current = { left: false, right: false, jump: false, crouch: false };
      vt.current = { left: false, right: false, jump: false, crouch: false };
      recompute();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [recompute]);

  // Keep durations advancing even when no key event fires (held key).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      recompute();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recompute]);

  const virtual: VirtualControls = {
    setLeft: (d) => {
      vt.current.left = d;
      recompute();
    },
    setRight: (d) => {
      vt.current.right = d;
      recompute();
    },
    setJump: (d) => {
      vt.current.jump = d;
      recompute();
    },
    setCrouch: (d) => {
      vt.current.crouch = d;
      recompute();
    },
  };

  const consumePause = useCallback(() => {
    if (pauseQueued.current) {
      pauseQueued.current = false;
      return true;
    }
    return false;
  }, []);

  return { inputRef, virtual, consumePause };
}
