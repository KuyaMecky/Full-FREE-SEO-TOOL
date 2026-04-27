'use client';

type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG = {
  idle: { bg: 'bg-gray-500', text: 'text-gray-700', label: 'Idle' },
  loading: { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Loading', animate: true },
  success: { bg: 'bg-green-500', text: 'text-green-700', label: 'Success' },
  error: { bg: 'bg-red-500', text: 'text-red-700', label: 'Error' },
  warning: { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Warning' },
};

const SIZE_CONFIG = {
  sm: { badge: 'w-2 h-2', text: 'text-xs px-2 py-1' },
  md: { badge: 'w-3 h-3', text: 'text-sm px-3 py-1.5' },
  lg: { badge: 'w-4 h-4', text: 'text-base px-4 py-2' },
};

// Status badge with dot indicator
export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const displayLabel = label || config.label;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeConfig.badge} rounded-full ${config.bg} ${
          config.animate ? 'animate-pulse' : ''
        }`}
      />
      <span className={`font-medium ${sizeConfig.text} text-gray-700 dark:text-gray-300`}>
        {displayLabel}
      </span>
    </div>
  );
}

// Animated circular progress
export function CircularProgress({
  progress,
  size = 'md',
  color = 'green',
}: {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'purple';
}) {
  const sizeMap = {
    sm: { diameter: 32, strokeWidth: 2, fontSize: 'text-xs' },
    md: { diameter: 48, strokeWidth: 3, fontSize: 'text-sm' },
    lg: { diameter: 64, strokeWidth: 4, fontSize: 'text-base' },
  };

  const colorMap = {
    green: 'stroke-green-500',
    blue: 'stroke-blue-500',
    purple: 'stroke-purple-500',
  };

  const { diameter, strokeWidth, fontSize } = sizeMap[size];
  const radius = diameter / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={diameter} height={diameter} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-700/30 dark:text-gray-600/30"
          />
          {/* Progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${colorMap[color]} transition-all duration-500 stroke-linecap`}
            strokeLinecap="round"
          />
        </svg>
        {/* Center text */}
        <div className={`absolute flex items-center justify-center ${fontSize} font-bold text-gray-700 dark:text-gray-300`}>
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}

// Linear progress bar with label
export function LinearProgress({
  progress,
  label,
  showLabel = true,
  color = 'green',
}: {
  progress: number;
  label?: string;
  showLabel?: boolean;
  color?: 'green' | 'blue' | 'purple' | 'red';
}) {
  const colorMap = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-2">
      {(label || showLabel) && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{label || 'Progress'}</span>
          <span className="text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorMap[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Pulsing status indicator
export function PulsingIndicator({
  color = 'green',
  label,
}: {
  color?: 'green' | 'blue' | 'red' | 'yellow';
  label?: string;
}) {
  const colorMap = {
    green: { dot: 'bg-green-500', ring: 'ring-green-500' },
    blue: { dot: 'bg-blue-500', ring: 'ring-blue-500' },
    red: { dot: 'bg-red-500', ring: 'ring-red-500' },
    yellow: { dot: 'bg-yellow-500', ring: 'ring-yellow-500' },
  };

  const colors = colorMap[color];

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-4 h-4">
        <div className={`absolute w-full h-full rounded-full ${colors.dot} animate-pulse`} />
        <div
          className={`absolute w-full h-full rounded-full ring-2 ${colors.ring} animate-ping`}
          style={{ animationDuration: '2s' }}
        />
        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
      </div>
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
    </div>
  );
}

// Multi-step progress indicator
export function StepProgress({
  currentStep,
  totalSteps,
  steps,
}: {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
}) {
  return (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep - 1;

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              {steps && steps[i] && (
                <span className={`text-xs text-center max-w-[60px] ${
                  isCompleted || isCurrent ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {steps[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}

// Skeleton loader with pulse effect
export function SkeletonLoader({ lines = 3, variant = 'default' }: { lines?: number; variant?: 'default' | 'compact' }) {
  const height = variant === 'compact' ? 'h-3' : 'h-4';

  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-300 dark:bg-gray-700 rounded animate-pulse`}
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
