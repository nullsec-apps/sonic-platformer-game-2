import { useCallback, useEffect, useState } from 'react';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../lib/physicsConstants';

// Computes integer pixel-perfect scaling for the game canvas so it fills the
// available viewport at 16:9 while keeping crisp pixels. Recalculates on resize.

interface CanvasScale {
  scale: number;
  displayWidth: number;
  displayHeight: number;
  viewWidth: number;
  viewHeight: number;
}

export function useCanvasScale(
  containerRef?: React.RefObject<HTMLElement>
): CanvasScale {
  const compute = useCallback((): CanvasScale => {
    if (typeof window === 'undefined') {
      return {
        scale: 1,
        displayWidth: VIEW_WIDTH,
        displayHeight: VIEW_HEIGHT,
        viewWidth: VIEW_WIDTH,
        viewHeight: VIEW_HEIGHT,
      };
    }
    let availW = window.innerWidth;
    let availH = window.innerHeight;
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) availW = rect.width;
      if (rect.height > 0) availH = rect.height;
    }
    // Leave a touch of breathing room for HUD letterboxing.
    const padW = availW;
    const padH = availH;
    const rawScale = Math.min(padW / VIEW_WIDTH, padH / VIEW_HEIGHT);
    // Integer scale for pixel-perfect rendering; allow fractional on very small
    // screens so the game still fits at 360px width.
    let scale = Math.floor(rawScale);
    if (scale < 1) {
      scale = Math.max(0.4, rawScale);
    }
    const displayWidth = Math.round(VIEW_WIDTH * scale);
    const displayHeight = Math.round(VIEW_HEIGHT * scale);
    return {
      scale,
      displayWidth,
      displayHeight,
      viewWidth: VIEW_WIDTH,
      viewHeight: VIEW_HEIGHT,
    };
  }, [containerRef]);

  const [state, setState] = useState<CanvasScale>(compute);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setState(compute()));
    };
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    let ro: ResizeObserver | null = null;
    if (containerRef?.current && 'ResizeObserver' in window) {
      ro = new ResizeObserver(onResize);
      ro.observe(containerRef.current);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (ro) ro.disconnect();
    };
  }, [compute, containerRef]);

  return state;
}
