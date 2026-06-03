import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { VirtualControls } from '../hooks/useInput';
import { cn } from '../lib/utils';

interface MobileControlsProps {
  virtual: VirtualControls;
  visible?: boolean;
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

function PadButton({
  children,
  onDown,
  onUp,
  active,
  className,
  label,
}: {
  children: React.ReactNode;
  onDown: () => void;
  onUp: () => void;
  active: boolean;
  className?: string;
  label: string;
}) {
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      onDown();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onUp();
    },
    onPointerCancel: () => onUp(),
    onPointerLeave: () => onUp(),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
  return (
    <button
      type="button"
      aria-label={label}
      {...handlers}
      className={cn(
        'flex select-none items-center justify-center border-4 transition-all duration-100 active:translate-y-0.5',
        active
          ? 'border-[#ffcc00] bg-[#1a6ad6] text-[#fdf6e3] shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]'
          : 'border-[#0a1a4a] bg-[#142a6e] text-[#fdf6e3] shadow-[0_4px_0_#0a1a4a]',
        className
      )}
      style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </button>
  );
}

export function MobileControls({ virtual, visible = true }: MobileControlsProps) {
  const [touch, setTouch] = useState(false);
  const [state, setState] = useState({ left: false, right: false, jump: false, crouch: false });

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  if (!touch || !visible) return null;

  const set = (key: keyof typeof state, down: boolean) => {
    setState((s) => ({ ...s, [key]: down }));
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-end justify-between px-3 pb-4 sm:px-6 sm:pb-6">
      {/* D-pad bottom-left */}
      <div className="pointer-events-auto flex items-end gap-2">
        <PadButton
          label="Move left"
          active={state.left}
          onDown={() => {
            set('left', true);
            virtual.setLeft(true);
          }}
          onUp={() => {
            set('left', false);
            virtual.setLeft(false);
          }}
          className="h-16 w-16"
        >
          <ChevronLeft size={32} strokeWidth={2.5} />
        </PadButton>
        <PadButton
          label="Move right"
          active={state.right}
          onDown={() => {
            set('right', true);
            virtual.setRight(true);
          }}
          onUp={() => {
            set('right', false);
            virtual.setRight(false);
          }}
          className="h-16 w-16"
        >
          <ChevronRight size={32} strokeWidth={2.5} />
        </PadButton>
      </div>

      {/* Crouch + Jump bottom-right */}
      <div className="pointer-events-auto flex items-end gap-2">
        <PadButton
          label="Crouch / spin dash"
          active={state.crouch}
          onDown={() => {
            set('crouch', true);
            virtual.setCrouch(true);
          }}
          onUp={() => {
            set('crouch', false);
            virtual.setCrouch(false);
          }}
          className="h-14 w-14"
        >
          <ChevronDown size={28} strokeWidth={2.5} />
        </PadButton>
        <PadButton
          label="Jump"
          active={state.jump}
          onDown={() => {
            set('jump', true);
            virtual.setJump(true);
          }}
          onUp={() => {
            set('jump', false);
            virtual.setJump(false);
          }}
          className="h-20 w-20 rounded-full"
        >
          <span className="font-display text-[10px] text-[#ffcc00]">JUMP</span>
        </PadButton>
      </div>
    </div>
  );
}

export default MobileControls;
