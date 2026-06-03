import { forwardRef } from 'react';

interface GameCanvasProps {
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  shakeX?: number;
  shakeY?: number;
}

/**
 * The pixel-perfect render surface. The game engine draws directly to this
 * canvas via its 2D context (smoothing disabled in the renderer). We only own
 * the DOM element + integer scaling here.
 */
export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ width, height, displayWidth, displayHeight, shakeX = 0, shakeY = 0 }, ref) => {
    return (
      <canvas
        ref={ref}
        width={width}
        height={height}
        className="block select-none"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          imageRendering: 'pixelated',
          transform: `translate3d(${shakeX}px, ${shakeY}px, 0)`,
          touchAction: 'none',
          background: '#0a1a4a',
        }}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
