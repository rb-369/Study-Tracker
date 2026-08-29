'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Zap, 
  Trophy, 
  Flame, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  Timer,
  Award
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ExtendedUserProfile } from '@/types/social';

interface MathProblem {
  num1: number;
  num2: number;
  operator: '+' | '-' | '×';
  answer: number;
}

function generateProblem(): MathProblem {
  const ops: ('+' | '-' | '×')[] = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 40) + 10;
    num2 = Math.floor(Math.random() * 40) + 10;
    answer = num1 + num2;
  } else if (op === '-') {
    num1 = Math.floor(Math.random() * 50) + 20;
    num2 = Math.floor(Math.random() * num1) + 5;
    answer = num1 - num2;
  } else {
    num1 = Math.floor(Math.random() * 11) + 2;
    num2 = Math.floor(Math.random() * 11) + 2;
    answer = num1 * num2;
  }

  return { num1, num2, operator: op, answer };
}

interface SpeedMathDuelProps {
  sessionId: string;
  currentUser: ExtendedUserProfile;
  targetFriend?: ExtendedUserProfile;
  onGameEnd?: (myScore: number, buddyScore: number) => void;
}

export function SpeedMathDuel({
  sessionId,
  currentUser,
  targetFriend,
  onGameEnd,
}: SpeedMathDuelProps) {
  const supabase = createClient();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [myScore, setMyScore] = useState<number>(0);
  const [buddyScore, setBuddyScore] = useState<number>(0);
  
  const [problem, setProblem] = useState<MathProblem>(generateProblem());
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const buddyName = targetFriend?.full_name?.split(' ')[0] || targetFriend?.handle || 'Buddy';

  // Broadcast channel for live score sync
  useEffect(() => {
    if (!sessionId) return;

    const channelId = `math_duel_${sessionId}`;
    const channel = supabase.channel(channelId, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'math_score' }, (payload) => {
        if (payload.payload?.score !== undefined) {
          setBuddyScore(payload.payload.score);
        }
      })
      .on('broadcast', { event: 'game_start' }, () => {
        setGameState('playing');
        setTimeLeft(30);
        setMyScore(0);
        setBuddyScore(0);
        setProblem(generateProblem());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // Start Game
  const handleStartGame = () => {
    setGameState('playing');
    setTimeLeft(30);
    setMyScore(0);
    setBuddyScore(0);
    setProblem(generateProblem());
    setUserAnswer('');

    // Broadcast start to partner
    const channelId = `math_duel_${sessionId}`;
    supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'game_start',
      payload: { startedBy: currentUser.id },
    });

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Timer Tick
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('finished');
          if (onGameEnd) onGameEnd(myScore, buddyScore);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, myScore, buddyScore, onGameEnd]);

  // Handle Answer Submission
  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(userAnswer.trim(), 10);
    if (isNaN(val)) return;

    if (val === problem.answer) {
      const nextScore = myScore + 10;
      setMyScore(nextScore);
      setFeedback('correct');

      // Broadcast score to buddy
      const channelId = `math_duel_${sessionId}`;
      supabase.channel(channelId).send({
        type: 'broadcast',
        event: 'math_score',
        payload: { score: nextScore },
      });
    } else {
      setFeedback('wrong');
    }

    setUserAnswer('');
    setProblem(generateProblem());
    setTimeout(() => setFeedback(null), 500);
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 rounded-3xl bg-zinc-950/90 border border-amber-500/30 text-center space-y-4 shadow-2xl relative overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2 text-left">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>2-Player Speed Math Duel</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono">30s WARMUP</span>
            </h4>
            <p className="text-[10px] text-zinc-400">Reboot mental focus between study sprints</p>
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Live Duel Scores */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">You</span>
          <span className="text-2xl font-black font-mono text-teal-300 tabular-nums">{myScore}</span>
          <span className="text-[10px] text-zinc-500">pts</span>
        </div>

        <div className="flex flex-col items-center border-l border-zinc-800">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{buddyName}</span>
          <span className="text-2xl font-black font-mono text-indigo-300 tabular-nums">{buddyScore}</span>
          <span className="text-[10px] text-zinc-500">pts</span>
        </div>
      </div>

      {/* Game Stages */}
      {gameState === 'idle' && (
        <div className="py-4 space-y-3">
          <p className="text-xs text-zinc-300">
            Challenge <span className="text-amber-300 font-bold">{buddyName}</span> to a 30-second mental arithmetic sprint!
          </p>
          <button
            onClick={handleStartGame}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-zinc-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            Start Math Duel ⚡
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="py-2 space-y-3">
          {/* Arithmetic Problem */}
          <div className={`p-4 rounded-2xl border text-3xl sm:text-4xl font-black font-mono tracking-wider transition-all ${
            feedback === 'correct' 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 scale-105' 
              : (feedback === 'wrong' ? 'bg-rose-500/20 border-rose-500 text-rose-300 scale-95' : 'bg-zinc-900 border-zinc-800 text-white')
          }`}>
            {problem.num1} {problem.operator} {problem.num2} = ?
          </div>

          {/* Quick Input */}
          <form onSubmit={handleSubmitAnswer} className="flex items-center gap-2 max-w-xs mx-auto">
            <input
              ref={inputRef}
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Answer..."
              className="flex-1 bg-zinc-900 border border-amber-500/40 rounded-xl px-4 py-2 text-center text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all active:scale-95"
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="py-3 space-y-3 animate-slide-up">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
            {myScore > buddyScore ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>You Won the Duel! +30 Brain XP 🏆</span>
              </div>
            ) : myScore === buddyScore ? (
              <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                <span>Dead Heat Tie! Great Brain Warmup ⚡</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-sm">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>{buddyName} Won! +20 Brain XP 👏</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStartGame}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 mx-auto active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rematch</span>
          </button>
        </div>
      )}

    </div>
  );
}
