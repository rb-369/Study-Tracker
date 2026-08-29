'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Wind, Eye, CheckCircle2, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { formatSecondsToTimer } from '@/lib/utils';

interface ZenBreathworkProps {
  breakRemainingSeconds: number;
  onCompleteExercise?: (score: number, durationSeconds: number) => void;
}

type Technique = 'box' | 'relax_478' | 'eye_destrain';

export function ZenBreathwork({ breakRemainingSeconds, onCompleteExercise }: ZenBreathworkProps) {
  const [technique, setTechnique] = useState<Technique>('box');
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalSecondsPracticed, setTotalSecondsPracticed] = useState(0);
  const [eyeDotPosition, setEyeDotPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Technique timing profiles (in seconds)
  const timings = {
    box: { Inhale: 4, Hold: 4, Exhale: 4, Rest: 4 },
    relax_478: { Inhale: 4, Hold: 7, Exhale: 8, Rest: 1 },
    eye_destrain: { Inhale: 3, Hold: 3, Exhale: 3, Rest: 3 }, // Guides gaze around periphery
  };

  // Breathing Cycle Engine
  useEffect(() => {
    let currentStep = 0;
    const currentTiming = timings[technique];
    const sequence: Array<'Inhale' | 'Hold' | 'Exhale' | 'Rest'> = 
      technique === 'relax_478' 
        ? ['Inhale', 'Hold', 'Exhale', 'Rest'] 
        : ['Inhale', 'Hold', 'Exhale', 'Rest'];

    let currentPhaseIndex = 0;
    let secondsInPhase = 0;

    const interval = setInterval(() => {
      setTotalSecondsPracticed((prev) => prev + 1);

      const targetDuration = currentTiming[sequence[currentPhaseIndex]];
      secondsInPhase += 1;
      setPhaseProgress((secondsInPhase / targetDuration) * 100);

      if (technique === 'eye_destrain') {
        // Move gaze dot in a smooth figure-8 / rectangle
        const angle = (Date.now() / 1500) % (2 * Math.PI);
        const x = 50 + 35 * Math.cos(angle);
        const y = 50 + 25 * Math.sin(2 * angle) / 2;
        setEyeDotPosition({ x, y });
      }

      if (secondsInPhase >= targetDuration) {
        secondsInPhase = 0;
        currentPhaseIndex = (currentPhaseIndex + 1) % sequence.length;
        setPhase(sequence[currentPhaseIndex]);
        setPhaseProgress(0);

        if (currentPhaseIndex === 0) {
          setCompletedCycles((c) => {
            const next = c + 1;
            if (onCompleteExercise) {
              onCompleteExercise(next * 25, next * 16);
            }
            return next;
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [technique]);

  const getPhaseInstruction = () => {
    if (technique === 'eye_destrain') {
      return 'Follow the soothing golden dot smoothly with your eyes without moving your head';
    }
    switch (phase) {
      case 'Inhale':
        return 'Deep breath in through your nose... expand your lungs';
      case 'Hold':
        return 'Gently hold your breath... stay calm & still';
      case 'Exhale':
        return 'Slow, controlled breath out through your mouth... release tension';
      case 'Rest':
        return 'Pause and feel the stillness in your body';
    }
  };

  const getBubbleScale = () => {
    if (technique === 'eye_destrain') return 'scale-100';
    if (phase === 'Inhale') return 'scale-125 transition-transform duration-[4000ms] ease-out';
    if (phase === 'Hold') return 'scale-125 transition-transform duration-500';
    if (phase === 'Exhale') return 'scale-90 transition-transform duration-[4000ms] ease-in-out';
    return 'scale-90 transition-transform duration-500';
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-lg mx-auto py-2 px-4 text-center">
      {/* Mode Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs font-semibold mb-4">
        <button
          onClick={() => setTechnique('box')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            technique === 'box'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Box (4-4-4-4)</span>
        </button>

        <button
          onClick={() => setTechnique('relax_478')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            technique === 'relax_478'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>4-7-8 Deep Calm</span>
        </button>

        <button
          onClick={() => setTechnique('eye_destrain')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            technique === 'eye_destrain'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Eye De-strain</span>
        </button>
      </div>

      {/* Main Breathing Visualizer Canvas */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4 select-none">
        {/* Outer ambient glow rings */}
        <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-2xl animate-pulse" />
        <div className="absolute inset-4 rounded-full border border-teal-500/20 animate-spin-slow" />
        <div className="absolute inset-8 rounded-full border border-dashed border-teal-500/30" />

        {technique === 'eye_destrain' ? (
          /* Eye De-strain Tracking Arena */
          <div className="relative w-full h-full rounded-full border border-zinc-800 bg-zinc-950/60 overflow-hidden flex items-center justify-center">
            {/* Guide Grid Lines */}
            <div className="absolute inset-x-0 top-1/2 border-t border-zinc-800/40" />
            <div className="absolute inset-y-0 left-1/2 border-l border-zinc-800/40" />
            <div className="absolute text-center text-xs text-zinc-500 font-mono pointer-events-none">
              Track the dot with eyes
            </div>

            {/* Smooth Floating Dot */}
            <div
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-gradient-to-r from-amber-400 to-teal-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] transition-all duration-300 ease-linear flex items-center justify-center"
              style={{
                left: `${eyeDotPosition.x}%`,
                top: `${eyeDotPosition.y}%`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
          </div>
        ) : (
          /* Expanding Breathing Bubble */
          <div
            className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.3)] bg-gradient-to-br from-teal-500/20 via-emerald-500/15 to-indigo-600/20 border border-teal-400/40 backdrop-blur-md ${getBubbleScale()}`}
          >
            <span className="text-xs uppercase font-mono tracking-widest text-teal-300 font-bold">
              {phase}
            </span>
            <span className="text-3xl font-black text-white font-mono mt-1 drop-shadow-md">
              {timings[technique][phase] - Math.floor((phaseProgress / 100) * timings[technique][phase])}s
            </span>
          </div>
        )}
      </div>

      {/* Guided Instruction Text */}
      <div className="min-h-[50px] flex items-center justify-center mt-2">
        <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-sm leading-relaxed animate-fade-in">
          {getPhaseInstruction()}
        </p>
      </div>

      {/* Session Progress Stats */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-zinc-800/80 w-full text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{completedCycles} Cycles Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-teal-400" />
          <span>{totalSecondsPracticed}s Mindful Reset</span>
        </div>
      </div>
    </div>
  );
}
