import { ArrowLeftRight, ArrowUp, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface ControlsHintProps {
  className?: string;
  variant?: 'full' | 'compact';
  animate?: boolean;
}

interface HintItem {
  icon: React.ReactNode;
  keyLabel: string;
  action: string;
}

const HINTS: HintItem[] = [
  { icon: <ArrowLeftRight size={14} strokeWidth={2.5} />, keyLabel: 'ARROWS', action: 'MOVE' },
  { icon: <ArrowUp size={14} strokeWidth={2.5} />, keyLabel: 'SPACE', action: 'JUMP' },
  { icon: <RotateCcw size={14} strokeWidth={2.5} />, keyLabel: 'HOLD DOWN', action: 'SPIN DASH' },
];

export function ControlsHint({ className, variant = 'full', animate = true }: ControlsHintProps) {
  const Wrapper: any = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.15 },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'flex flex-wrap items-center justify-center gap-2 sm:gap-3',
        'border-2 border-[#5a78c8] bg-[#142a6e] px-3 py-2',
        'shadow-[3px_3px_0_0_#0a1a4a]',
        className
      )}
      style={{ imageRendering: 'pixelated' }}
    >
      {HINTS.map((h, i) => (
        <div key={h.action} className="flex items-center gap-2">
          {i > 0 && variant === 'full' && (
            <span className="hidden text-[#5a78c8] sm:inline">|</span>
          )}
          <span className="flex h-6 w-6 items-center justify-center border-2 border-[#ffcc00] bg-[#0a1a4a] text-[#ffcc00]">
            {h.icon}
          </span>
          <span
            className="text-[10px] leading-none text-[#ffcc00]"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {h.keyLabel}
          </span>
          <span
            className="text-base leading-none text-[#fdf6e3] sm:text-lg"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            = {h.action}
          </span>
        </div>
      ))}
    </Wrapper>
  );
}

export default ControlsHint;
