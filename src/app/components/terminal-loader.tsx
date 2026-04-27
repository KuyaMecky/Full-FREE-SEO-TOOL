'use client';

import { useEffect, useState } from 'react';

interface TerminalLoaderProps {
  message?: string;
  subtitle?: string;
  stage?: number;
  variant?: 'compact' | 'full';
}

const TERMINAL_MESSAGES = [
  'Initializing systems...',
  'Connecting to API...',
  'Fetching data...',
  'Processing request...',
  'Compiling results...',
  'Optimizing output...',
  'Finalizing...',
];

export function TerminalLoader({
  message,
  subtitle,
  stage = 0,
  variant = 'full',
}: TerminalLoaderProps) {
  const [displayText, setDisplayText] = useState('');
  const [cursor, setCursor] = useState(true);
  const [dots, setDots] = useState('');

  const finalMessage = message || TERMINAL_MESSAGES[stage % TERMINAL_MESSAGES.length];

  // Typewriter effect
  useEffect(() => {
    if (displayText.length < finalMessage.length) {
      const timer = setTimeout(() => {
        setDisplayText(finalMessage.slice(0, displayText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [displayText, finalMessage]);

  // Blinking cursor
  useEffect(() => {
    const timer = setInterval(() => setCursor(c => !c), 500);
    return () => clearInterval(timer);
  }, []);

  // Animated dots
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(d => (d.length < 3 ? d + '.' : ''));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
        <span className="text-sm font-mono text-green-400">{finalMessage}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 border border-green-700/50 rounded-lg p-6 font-mono text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-700/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400/70 text-xs">SYSTEM_TERMINAL</span>
        </div>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Main message with typewriter effect */}
        <div className="text-green-400">
          <span className="text-green-600">{'>'}</span> {displayText}
          <span className={`${cursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>▊</span>
        </div>

        {/* Subtitle/stage info */}
        {subtitle && (
          <div className="text-green-400/60 text-xs">
            <span className="text-green-600">{'>'}</span> {subtitle}
          </div>
        )}

        {/* Loading indicator */}
        <div className="text-green-400/60 text-xs">
          <span className="text-green-600">{'>'}</span> Loading
          <span>{dots}</span>
        </div>

        {/* Status bar */}
        <div className="mt-4 pt-3 border-t border-green-700/20">
          <div className="flex items-center gap-2 text-xs text-green-400/60">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <span>System active • Processing data...</span>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-gradient-to-b from-green-400/5 to-transparent"
          style={{
            backgroundSize: '100% 2px',
            animation: 'scan 8s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
}

// Compact inline variant
export function TerminalStatus({ message = 'Processing...' }: { message?: string }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setDots(d => (d.length < 3 ? d + '.' : ''));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-mono text-green-400 bg-gray-950/50 border border-green-700/30 rounded px-3 py-2">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span>{message}</span>
      <span className="text-green-400/60">{dots}</span>
    </div>
  );
}

// Skeleton loader with terminal style
export function TerminalSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-gray-950 border border-green-700/30 rounded-lg p-4 space-y-2 font-mono">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-green-600">{'>'}</span>
          <div className="flex-1 h-4 bg-gradient-to-r from-green-400/20 to-transparent rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
