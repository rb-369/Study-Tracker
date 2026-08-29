'use client';

import React, { useState } from 'react';
import { 
  X, 
  Wind, 
  Brain, 
  Zap, 
  Calculator, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Timer, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { ZenBreathwork } from './ZenBreathwork';
import { formatSecondsToTimer } from '@/lib/utils';
import { useStudyStore } from '@/lib/store/useStudyStore';

interface BreakGamesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNextSprint: () => void;
}

type ActiveGame = 'zen' | 'memory' | 'stroop' | 'math';

export function BreakGamesHubModal({
  isOpen,
  onClose,
  onStartNextSprint,
}: BreakGamesHubModalProps) {
  const { activeTimer, resumeBreak, pauseBreak } = useStudyStore();
  const [selectedGame, setSelectedGame] = useState<ActiveGame>('zen');
  const [gameScore, setGameScore] = useState<number>(0);

  if (!isOpen) return null;

  const breakState = activeTimer.breakState;
  const breakTargetSeconds = (breakState?.breakTargetMinutes || 5) * 60;
  const breakElapsedSeconds = breakState?.breakElapsedSeconds || 0;
  const breakRemainingSeconds = Math.max(0, breakTargetSeconds - breakElapsedSeconds);
  const isBreakEnded = breakRemainingSeconds <= 0;

  const handleGameComplete = (score: number, durationSeconds: number) => {
    setGameScore((prev) => prev + score);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header with Real-Time Break Countdown */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Brain Oasis &bull; Mindful Break Gym</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cognitive recharge &bull; auto-pauses when focus resumes
              </p>
            </div>
          </div>

          {/* Real-time Break Timer Pill */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold transition-all ${
              isBreakEnded 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse' 
                : 'bg-zinc-800 text-teal-300 border-teal-500/30 shadow-inner'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{formatSecondsToTimer(breakRemainingSeconds)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Strict Auto-Pause Overlay when Break Hits Zero */}
        {isBreakEnded && (
          <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Break Time Complete!</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
              Your mind is refreshed and cortisol is reset. Ready to dive into your next deep work focus block?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onStartNextSprint();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Start Next Focus Sprint</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Game Suite Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-zinc-800/60 overflow-x-auto">
          <button
            onClick={() => setSelectedGame('zen')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              selectedGame === 'zen'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Zen Breath & Eye Rest</span>
          </button>

          <button
            onClick={() => setSelectedGame('memory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              selectedGame === 'memory'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Matrix</span>
          </button>

          <button
            onClick={() => setSelectedGame('stroop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              selectedGame === 'stroop'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Stroop Clash</span>
          </button>

          <button
            onClick={() => setSelectedGame('math')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              selectedGame === 'math'
                ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Speed Math</span>
          </button>
        </div>

        {/* Main Game Stage Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          {selectedGame === 'zen' && (
            <ZenBreathwork 
              breakRemainingSeconds={breakRemainingSeconds} 
              onCompleteExercise={handleGameComplete} 
            />
          )}

          {selectedGame === 'memory' && (
            <div className="text-center p-6 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Memory Matrix</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Test and expand your working memory by recalling flashing grid tile patterns in sequence.
              </p>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-teal-300 font-mono">
                🧠 Phase 3 Zen Breathwork is active. Memory Matrix unlocked for training!
              </div>
            </div>
          )}

          {selectedGame === 'stroop' && (
            <div className="text-center p-6 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Stroop Color Clash</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Train your selective attention and cognitive inhibition by matching font ink color vs word text.
              </p>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-amber-300 font-mono">
                ⚡ Focus reflex warmup active.
              </div>
            </div>
          )}

          {selectedGame === 'math' && (
            <div className="text-center p-6 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Calculator className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Speed Mental Math</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Rapid 30-second arithmetic sprints to kickstart mental alertness before deep problem-solving.
              </p>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-emerald-300 font-mono">
                🔢 Ready to sharpen arithmetic speed.
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar with Quick Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 text-xs">
          <div className="text-zinc-400">
            {gameScore > 0 && (
              <span className="font-mono text-emerald-400 font-bold">
                +{gameScore} Focus Energy Earned
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onStartNextSprint();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all flex items-center gap-1.5"
            >
              <span>Jump to Next Sprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
