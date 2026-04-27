'use client';

import { useEffect, useState } from 'react';

type TerminalColor = 'green' | 'cyan' | 'amber' | 'purple' | 'pink';

interface AdvancedTerminalProps {
  message?: string;
  color?: TerminalColor;
  showProgress?: boolean;
  progress?: number;
  showSystemInfo?: boolean;
  lines?: string[];
}

const COLOR_SCHEMES = {
  green: { text: 'text-green-400', border: 'border-green-700/50', bg: 'bg-green-400' },
  cyan: { text: 'text-cyan-400', border: 'border-cyan-700/50', bg: 'bg-cyan-400' },
  amber: { text: 'text-amber-400', border: 'border-amber-700/50', bg: 'bg-amber-400' },
  purple: { text: 'text-purple-400', border: 'border-purple-700/50', bg: 'bg-purple-400' },
  pink: { text: 'text-pink-400', border: 'border-pink-700/50', bg: 'bg-pink-400' },
};

export function AdvancedTerminal({
  message = 'Processing data...',
  color = 'green',
  showProgress = false,
  progress = 0,
  showSystemInfo = false,
  lines = [],
}: AdvancedTerminalProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);
  const scheme = COLOR_SCHEMES[color];

  // Typewriter effect for main message
  useEffect(() => {
    if (displayedLines.length === 0 && message) {
      const timer = setTimeout(() => {
        setDisplayedLines([message]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [displayedLines, message]);

  // Add additional lines
  useEffect(() => {
    if (lines.length > 0 && displayedLines.length === 1) {
      const timer = setTimeout(() => {
        setDisplayedLines([...displayedLines, ...lines]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lines, displayedLines]);

  // Blinking cursor
  useEffect(() => {
    const timer = setInterval(() => setCursor(c => !c), 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`bg-gray-950 border ${scheme.border} rounded-lg p-6 font-mono text-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${scheme.bg} animate-pulse`} />
          <span className={`${scheme.text}/70 text-xs`}>ADVANCED_SYSTEM</span>
        </div>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/50" />
          <div className={`w-3 h-3 rounded-full ${scheme.bg}/20 border ${scheme.border}`} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {displayedLines.map((line, i) => (
          <div key={i} className={scheme.text}>
            <span className={`${scheme.text}/60`}>{'>'}</span> {line}
            {i === displayedLines.length - 1 && (
              <span className={`${cursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>▊</span>
            )}
          </div>
        ))}

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-4 pt-3 border-t border-gray-700/20">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${scheme.text}/60`}>Progress</span>
              <span className={`text-xs font-mono ${scheme.text}`}>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden border border-gray-700/30">
              <div
                className={`h-full ${scheme.bg} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* System Info */}
        {showSystemInfo && (
          <div className={`mt-4 pt-3 border-t ${scheme.border} space-y-1 text-xs ${scheme.text}/60`}>
            <div>CPU: <span className={`${scheme.text}/80`}>42%</span></div>
            <div>Memory: <span className={`${scheme.text}/80`}>1.2 GB / 4 GB</span></div>
            <div>Network: <span className={`${scheme.text}/80`}>Active</span></div>
            <div>Timestamp: <span className={`${scheme.text}/80`}>{new Date().toISOString()}</span></div>
          </div>
        )}

        {/* Status bar */}
        <div className="mt-4 pt-3 border-t border-gray-700/20">
          <div className={`flex items-center gap-2 text-xs ${scheme.text}/60`}>
            <div className={`w-2 h-2 rounded-full ${scheme.bg} animate-pulse`} />
            <span>System active • Processing...</span>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"
          style={{
            backgroundSize: '100% 2px',
            animation: 'scan 8s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

// Matrix rain effect loader
export function MatrixTerminal({ duration = 3 }: { duration?: number }) {
  const [characters, setCharacters] = useState<string[]>([]);

  useEffect(() => {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const cols = 15;
    const rows = 10;
    const generated = Array.from({ length: cols * rows }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    );
    setCharacters(generated);

    const timer = setTimeout(() => setCharacters([]), duration * 1000);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className="bg-gray-950 border border-green-700/50 rounded-lg p-4 font-mono">
      <div className="grid gap-0" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
        {characters.map((char, i) => (
          <div
            key={i}
            className="text-green-400 text-xs h-6 flex items-center justify-center animate-pulse"
            style={{
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          >
            {char}
          </div>
        ))}
      </div>
    </div>
  );
}

// Glitch effect loader
export function GlitchTerminal({ message = 'SYSTEM_ERROR' }: { message?: string }) {
  const [glitchText, setGlitchText] = useState(message);

  useEffect(() => {
    const interval = setInterval(() => {
      const chars = message.split('');
      const glitched = chars.map((char, i) => {
        if (Math.random() < 0.1) {
          return String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }
        return char;
      });
      setGlitchText(glitched.join(''));
    }, 100);

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="bg-gray-950 border border-red-700/50 rounded-lg p-6 font-mono">
      <div className="text-red-400 text-lg font-bold tracking-widest">
        {glitchText}
        <span className="animate-pulse">▊</span>
      </div>
      <div className="text-red-600 text-xs mt-2 space-y-1">
        <div>ERROR_CODE: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        <div>STACK_TRACE: ../system/core/kernel.js:404</div>
        <div>STATUS: RECOVERING...</div>
      </div>
    </div>
  );
}

// Success terminal
export function SuccessTerminal({ message = 'Operation completed' }: { message?: string }) {
  return (
    <div className="bg-gray-950 border border-green-700/50 rounded-lg p-6 font-mono">
      <div className="flex items-center gap-3 text-green-400 mb-3">
        <div className="text-xl">✓</div>
        <span className="text-lg font-bold">{message}</span>
      </div>
      <div className="space-y-1 text-green-400/70 text-xs">
        <div>{'>'} All systems nominal</div>
        <div>{'>'} Processing complete</div>
        <div>{'>'} Status: SUCCESS</div>
      </div>
    </div>
  );
}

// Error terminal
export function ErrorTerminal({ error = 'Operation failed' }: { error?: string }) {
  return (
    <div className="bg-gray-950 border border-red-700/50 rounded-lg p-6 font-mono">
      <div className="flex items-center gap-3 text-red-400 mb-3">
        <div className="text-xl">✕</div>
        <span className="text-lg font-bold">{error}</span>
      </div>
      <div className="space-y-1 text-red-400/70 text-xs">
        <div>{'>'} System error detected</div>
        <div>{'>'} Check logs for details</div>
        <div>{'>'} Status: FAILED</div>
      </div>
    </div>
  );
}
