# UI Components Guide

Complete documentation for all UI components in SEO Audit Pro.

## Table of Contents

1. [API Status Indicators](#api-status-indicators)
2. [Terminal Loaders](#terminal-loaders)
3. [Advanced Terminal Components](#advanced-terminal-components)
4. [Status Indicators & Progress](#status-indicators--progress)
5. [Usage Examples](#usage-examples)

---

## API Status Indicators

### Overview

Display the availability and configuration status of all integrated APIs. Shows which integrations are connected and ready to use.

**Location**: `src/app/components/api-status-indicator.tsx`

### Features

- Checks 4 APIs: Google Search Console, AI Provider, PageSpeed, WordPress
- Shows configuration status (Connected / Not Set Up)
- Displays AI provider name if configured
- Warning message if required APIs missing
- 3 display variants: full, compact, inline

### Variants

#### Full Variant
Large, detailed display with complete API information.

```tsx
import { APIStatusIndicator } from '@/app/components/api-status-indicator';

<APIStatusIndicator variant="full" />
```

**Usage**: Settings page, integration reviews

**Features**:
- Header with live count (X/4 APIs configured)
- Color-coded status (green = connected, red = not set up)
- Separate cards for each API
- Warning banner if required APIs missing
- Required/Optional labels

#### Compact Variant
Grid layout for inline display.

```tsx
<APIStatusIndicator variant="compact" />
```

**Usage**: Audit creation page, above forms

**Features**:
- 2-column grid layout
- Compact icons and text
- Quick visual scanning
- 2 per row

#### Inline Variant
Single-line status display.

```tsx
<APIStatusIndicator variant="inline" />
```

**Usage**: Dashboard, headers, sidebars

**Features**:
- Text-based: "3/4 APIs configured"
- Color-coded text (green/red)
- Minimal footprint
- Always visible

### Props

```typescript
interface Props {
  variant?: 'full' | 'compact' | 'inline';
  showRequired?: boolean;
}
```

### APIs Checked

| API | Required | Type |
|-----|----------|------|
| Google Search Console | Yes | OAuth |
| AI Provider | Yes | API Key |
| PageSpeed Insights | No | API Key |
| WordPress | No | OAuth |

---

## Terminal Loaders

### Overview

Terminal-style loading indicators with active, engaging animations. Includes typewriter effect, blinking cursor, and CRT scan lines.

**Location**: `src/app/components/terminal-loader.tsx`

### Components

#### TerminalLoader

Full-featured terminal loader with all effects.

```tsx
import { TerminalLoader } from '@/app/components/terminal-loader';

<TerminalLoader
  message="Initializing audit..."
  subtitle="Starting domain crawl"
  variant="full"
/>
```

**Props**:

```typescript
interface TerminalLoaderProps {
  message?: string;
  subtitle?: string;
  stage?: number;
  variant?: 'compact' | 'full';
}
```

**Variants**:
- `full`: Large prominent display
- `compact`: Inline with animated dots

**Features**:
- Typewriter text effect (30ms per character)
- Blinking cursor animation
- Animated dots (... rotation)
- CRT scan line effect
- System status indicator
- Header with window controls
- 8 auto-rotating messages by stage

#### TerminalStatus

Inline status indicator for quick feedback.

```tsx
import { TerminalStatus } from '@/app/components/terminal-loader';

<TerminalStatus message="Checking API status" />
```

**Features**:
- Single-line display
- Green on dark background
- Animated dots
- Quick feedback

#### TerminalSkeleton

Placeholder for loading content.

```tsx
import { TerminalSkeleton } from '@/app/components/terminal-loader';

<TerminalSkeleton lines={3} />
```

**Props**:

```typescript
interface Props {
  lines?: number; // default: 3
}
```

### Animations

- **Typewriter**: 30ms per character, types message left-to-right
- **Cursor**: 500ms blink interval, blocks character (▊)
- **Dots**: 400ms animation, rotates (. .. ...)
- **Scan Lines**: 8s continuous downward movement

### Default Messages

Auto-rotates by stage:

```
0. "Initializing systems..."
1. "Connecting to API..."
2. "Fetching data..."
3. "Processing request..."
4. "Compiling results..."
5. "Optimizing output..."
6. "Finalizing..."
```

---

## Advanced Terminal Components

### Overview

Enhanced terminal components with colors, progress, system info, and special effects. Perfect for complex operations.

**Location**: `src/app/components/terminal-advanced.tsx`

### Components

#### AdvancedTerminal

Configurable terminal with themes and features.

```tsx
import { AdvancedTerminal } from '@/app/components/terminal-advanced';

<AdvancedTerminal
  message="Running comprehensive audit..."
  color="green"
  showProgress
  progress={65}
  showSystemInfo
  lines={['Scanning files', 'Analyzing content']}
/>
```

**Props**:

```typescript
interface Props {
  message?: string;
  color?: 'green' | 'cyan' | 'amber' | 'purple' | 'pink';
  showProgress?: boolean;
  progress?: number;
  showSystemInfo?: boolean;
  lines?: string[];
}
```

**Features**:
- 5 color themes
- Progress bar with %
- System info panel (CPU, memory, network, timestamp)
- Multi-line output
- Typewriter effect
- Blinking cursor

#### MatrixTerminal

Hacker-style matrix rain animation.

```tsx
import { MatrixTerminal } from '@/app/components/terminal-advanced';

<MatrixTerminal duration={3} />
```

**Props**:

```typescript
interface Props {
  duration?: number; // default: 3 seconds
}
```

**Features**:
- 15x10 character grid
- Random ASCII and Japanese characters
- Cascading animation with random opacity
- Pulse animation per character
- Auto-clears after duration

#### GlitchTerminal

Error state with dynamic text glitching.

```tsx
import { GlitchTerminal } from '@/app/components/terminal-advanced';

<GlitchTerminal message="SYSTEM_ERROR" />
```

**Props**:

```typescript
interface Props {
  message?: string;
}
```

**Features**:
- Dynamic character glitching (10% chance)
- Red color scheme
- Error code display
- Stack trace example
- Recovery status

#### SuccessTerminal

Positive completion state.

```tsx
import { SuccessTerminal } from '@/app/components/terminal-advanced';

<SuccessTerminal message="Operation completed" />
```

**Features**:
- Green checkmark
- Success message
- System status lines
- Positive indication

#### ErrorTerminal

Error state notification.

```tsx
import { ErrorTerminal } from '@/app/components/terminal-advanced';

<ErrorTerminal error="Connection timeout" />
```

**Features**:
- Red X indicator
- Error message
- Check logs prompt
- Failed status

### Color Themes

All components support 5 themes:

| Color | Text Class | Usage |
|-------|-----------|-------|
| Green | `text-green-400` | Success, default |
| Cyan | `text-cyan-400` | Processing, info |
| Amber | `text-amber-400` | Warning, caution |
| Purple | `text-purple-400` | Special, premium |
| Pink | `text-pink-400` | Highlight, accent |

---

## Status Indicators & Progress

### Overview

Various status indicators and progress trackers for showing operation state and completion.

**Location**: `src/app/components/status-indicators.tsx`

### Components

#### StatusBadge

Status indicator with dot and label.

```tsx
import { StatusBadge } from '@/app/components/status-indicators';

<StatusBadge status="loading" label="Processing" size="md" />
```

**Props**:

```typescript
interface Props {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Statuses**:
- `idle`: Gray, no animation
- `loading`: Blue, pulsing
- `success`: Green, static
- `error`: Red, static
- `warning`: Yellow, static

#### CircularProgress

Circular progress chart with percentage.

```tsx
import { CircularProgress } from '@/app/components/status-indicators';

<CircularProgress progress={65} size="md" color="green" />
```

**Props**:

```typescript
interface Props {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'purple';
}
```

**Sizes**:
- `sm`: 32px diameter
- `md`: 48px diameter (default)
- `lg`: 64px diameter

#### LinearProgress

Linear progress bar with optional label.

```tsx
import { LinearProgress } from '@/app/components/status-indicators';

<LinearProgress
  progress={75}
  label="Uploading"
  color="blue"
/>
```

**Props**:

```typescript
interface Props {
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
  color?: 'green' | 'blue' | 'purple' | 'red';
}
```

#### PulsingIndicator

Animated pulsing status dot.

```tsx
import { PulsingIndicator } from '@/app/components/status-indicators';

<PulsingIndicator color="green" label="Connected" />
```

**Props**:

```typescript
interface Props {
  color?: 'green' | 'blue' | 'red' | 'yellow';
  label?: string;
}
```

**Features**:
- Pulsing center dot
- Animated ring expansion
- Optional label
- 2 second animation cycle

#### StepProgress

Multi-step progress tracker.

```tsx
import { StepProgress } from '@/app/components/status-indicators';

<StepProgress
  currentStep={2}
  totalSteps={4}
  steps={['Crawl', 'Analyze', 'Score', 'Report']}
/>
```

**Props**:

```typescript
interface Props {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
}
```

**Features**:
- Visual step indicators
- Completed checkmarks
- Current step highlight
- Progress bar below
- Step counter
- Step labels (optional)

#### SkeletonLoader

Animated placeholder for loading content.

```tsx
import { SkeletonLoader } from '@/app/components/status-indicators';

<SkeletonLoader lines={3} variant="default" />
```

**Props**:

```typescript
interface Props {
  lines?: number; // default: 3
  variant?: 'default' | 'compact';
}
```

**Features**:
- Staggered pulse animation
- Last line shorter width
- Dark mode support
- Configurable line count

---

## Usage Examples

### Example 1: Audit Creation Flow

```tsx
import { APIStatusIndicator } from '@/app/components/api-status-indicator';
import { TerminalLoader } from '@/app/components/terminal-loader';

export function AuditForm() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Show API status at top */}
      <APIStatusIndicator variant="compact" />

      {/* Form fields... */}

      {/* Show loader while submitting */}
      {loading && (
        <TerminalLoader
          message="Starting audit..."
          subtitle="Initializing crawl engine"
          variant="full"
        />
      )}

      <button onClick={() => setLoading(true)}>
        Start Audit
      </button>
    </div>
  );
}
```

### Example 2: Progress Tracking

```tsx
import { AdvancedTerminal, LinearProgress, CircularProgress } from '@/app/components/...';

export function ProgressDemo() {
  const [progress, setProgress] = useState(0);

  return (
    <div className="space-y-6">
      {/* Linear progress with terminal */}
      <AdvancedTerminal
        message="Running audit..."
        showProgress
        progress={progress}
        color="cyan"
      />

      {/* Circular progress indicator */}
      <CircularProgress progress={progress} size="lg" color="blue" />

      {/* Step progress */}
      <StepProgress
        currentStep={Math.ceil(progress / 25)}
        totalSteps={4}
        steps={['Crawl', 'Analyze', 'Score', 'Report']}
      />
    </div>
  );
}
```

### Example 3: Status Notifications

```tsx
import {
  StatusBadge,
  PulsingIndicator,
  SuccessTerminal,
  ErrorTerminal
} from '@/app/components/status-indicators';

export function StatusDemo() {
  const [status, setStatus] = useState('loading');

  return (
    <div className="space-y-4">
      <StatusBadge status={status} label="Audit Status" />

      <PulsingIndicator
        color={status === 'success' ? 'green' : 'red'}
        label={status === 'success' ? 'Ready' : 'Error'}
      />

      {status === 'success' && (
        <SuccessTerminal message="Audit complete - 87/100" />
      )}

      {status === 'error' && (
        <ErrorTerminal error="Connection failed" />
      )}
    </div>
  );
}
```

### Example 4: Loading States

```tsx
import {
  TerminalLoader,
  TerminalStatus,
  TerminalSkeleton,
  SkeletonLoader
} from '@/app/components/...';

export function LoadingDemo() {
  return (
    <div className="space-y-6">
      {/* Full loader */}
      <TerminalLoader variant="full" />

      {/* Inline status */}
      <TerminalStatus message="Fetching data" />

      {/* Skeleton placeholders */}
      <TerminalSkeleton lines={5} />
      <SkeletonLoader lines={3} variant="compact" />
    </div>
  );
}
```

---

## Demo Pages

### Basic Loaders Demo

Visit: `/demo/loaders`

Shows all basic terminal loaders:
- Full variant with different messages
- Compact inline loaders
- Status indicators
- Skeleton placeholders
- Code examples
- Feature list

### Advanced Loaders Demo

Visit: `/demo/advanced-loaders`

Shows all advanced components:
- 5 color theme variants
- Progress tracking
- System information display
- Matrix rain effect
- Glitch effect
- Success/error states
- Combined workflow example
- Usage code examples

---

## Best Practices

### When to Use Each Component

| Component | Use Case | Example |
|-----------|----------|---------|
| APIStatusIndicator | Show integration status | Settings page |
| TerminalLoader | Long operations | Audit start, background jobs |
| TerminalStatus | Quick feedback | "Checking API status" |
| AdvancedTerminal | Complex operations with progress | Multi-step audit |
| CircularProgress | Percentage tracking | File upload, loading |
| LinearProgress | Simple progress | Page load, operation |
| StatusBadge | Current state | Connection status |
| PulsingIndicator | Active monitoring | API health, connection |
| StepProgress | Multi-step workflows | Audit steps, wizard |

### Color Usage

- **Green**: Success, ready, connected, default
- **Cyan**: Processing, info, data fetching
- **Amber**: Warning, caution, attention needed
- **Purple**: Premium, special, highlight
- **Pink**: Accent, special highlight, brand

### Animation Considerations

- Use full terminal for 3+ second operations
- Use compact for inline quick tasks
- Use status badges for persistent state
- Use progress for unknown duration tasks
- Use step progress for known multi-step processes

### Accessibility

- All components include alt text and labels
- Color isn't the only indicator (use icons, text)
- Animation respects `prefers-reduced-motion`
- Sufficient contrast ratios for readability
- Components work without JavaScript (graceful degradation)

---

## Troubleshooting

### Terminal Loader Not Showing

**Cause**: Component might be rendering too quickly

**Solution**: Check if loading state is true before rendering

```tsx
{loading && <TerminalLoader />}
```

### Progress Bar Not Updating

**Cause**: Progress might not be re-rendering

**Solution**: Ensure state updates trigger re-render

```tsx
setProgress(prev => prev + 10);
```

### Colors Look Wrong

**Cause**: Tailwind CSS might not have the class

**Solution**: Verify Tailwind config includes all colors:

```js
theme: {
  extend: {
    colors: {
      green, cyan, amber, purple, pink
    }
  }
}
```

### Animations Too Fast/Slow

**Solution**: Adjust animation timings in component:

```tsx
// Change typewriter speed (ms per char)
setTimeout(() => { ... }, 30) // Adjust 30ms

// Change animation duration
animation: 'scan 8s linear infinite' // Adjust 8s
```

---

## Component Exports

All components are exported from their respective files:

```typescript
// Terminal Loaders
export {
  TerminalLoader,
  TerminalStatus,
  TerminalSkeleton
} from '@/app/components/terminal-loader';

// Advanced Terminals
export {
  AdvancedTerminal,
  MatrixTerminal,
  GlitchTerminal,
  SuccessTerminal,
  ErrorTerminal
} from '@/app/components/terminal-advanced';

// Status Indicators
export {
  StatusBadge,
  CircularProgress,
  LinearProgress,
  PulsingIndicator,
  StepProgress,
  SkeletonLoader
} from '@/app/components/status-indicators';

// API Status
export {
  APIStatusIndicator,
  fetchAPIStatus
} from '@/app/components/api-status-indicator';
```

---

## File Locations

| Component Type | File Location |
|----------------|---------------|
| API Status | `src/app/components/api-status-indicator.tsx` |
| Terminal Loaders | `src/app/components/terminal-loader.tsx` |
| Advanced Terminals | `src/app/components/terminal-advanced.tsx` |
| Status Indicators | `src/app/components/status-indicators.tsx` |
| Demo (Basic) | `src/app/demo/loaders/page.tsx` |
| Demo (Advanced) | `src/app/demo/advanced-loaders/page.tsx` |

---

## Version Info

- **Version**: 1.0
- **Last Updated**: 2026-04-27
- **Components**: 13 main components
- **Demo Pages**: 2 comprehensive showcases
- **Dependencies**: Tailwind CSS (no external animation libraries)

For additional help, see:
- [VPS Deployment Guide](./VPS_DEPLOYMENT_GUIDE.md)
- [Docker Deployment](./DOCKER_DEPLOYMENT.md)
