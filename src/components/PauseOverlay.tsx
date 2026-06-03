import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, LogOut, Pause } from 'lucide-react';
import { ControlsHint } from './ControlsHint';
import { cn } from '../lib/utils';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

interface MenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

export function PauseOverlay({ onResume, onRestart, onQuit }: PauseOverlayProps) {
  // ESC also resumes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume]);

  const actions: MenuAction[] = [
    { label: 'RESUME', icon: <Play size={16} strokeWidth={2.5} />, onClick: onResume, primary: true },
    { label: 'RESTART', icon: <RotateCcw size={16} strokeWidth={2.5} />, onClick: onRestart },
    { label: 'QUIT TO MENU', icon: <LogOut size={16} strokeWidth={2.5} />, onClick: onQuit },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#0a1a4a]/90 px-4 backdrop-blur-[1px]"
    >
      <motion.div
        initial={{ scale: 0.85, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm border-4 border-[#0a1a4a] bg-[#142a6e] p-5 shadow-[8px_8px_0_rgba(0,0,0,0.45)] sm:p-6"
      >
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <Pause size={20} className="text-[#ffcc00]" strokeWidth={2.5} />
          </motion.span>
          <h2 className="font-display text-base text-[#ffcc00] drop-shadow-[2px_2px_0_#0a1a4a] sm:text-lg">
            PAUSED
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {actions.map((a, i) => (
            <motion.button
              key={a.label}
              type="button"
              onClick={a.onClick}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.06 }}
              className={cn(
                'group flex min-h-[48px] items-center justify-center gap-2 border-4 border-[#0a1a4a] px-4 py-3 font-display text-[9px] shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:text-[10px]',
                a.primary
                  ? 'bg-[#ffcc00] text-[#0a1a4a] hover:bg-[#ffd83a]'
                  : 'bg-[#1a6ad6] text-[#fdf6e3] hover:bg-[#2e80e8]'
              )}
            >
              <span className="transition-transform duration-150 group-hover:-translate-x-0.5">
                {a.icon}
              </span>
              {a.label}
            </motion.button>
          ))}
        </div>

        <ControlsHint className="mt-5" variant="compact" animate={false} />
      </motion.div>
    </motion.div>
  );
}

export default PauseOverlay;
