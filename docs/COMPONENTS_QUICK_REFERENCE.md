# Components Quick Reference

Fast lookup for all UI components.

## Crawl Progress Live

### CrawlProgressLive
```tsx
<CrawlProgressLive
  auditId="audit-123"
  onComplete={(status) => {
    if (status === 'complete') navigate('/audit/123');
  }}
/>
```
✅ Real-time progress, SSE streaming, error tracking

---

## Terminal Loaders

### TerminalLoader
```tsx
<TerminalLoader
  message="Loading..."
  subtitle="Processing data"
  variant="full" // or 'compact'
  stage={0} // 0-6, auto-rotates messages
/>
```
✅ Full terminal, typewriter effect, cursor, dots

### TerminalStatus
```tsx
<TerminalStatus message="Checking status" />
```
✅ Inline, animated dots, quick feedback

### TerminalSkeleton
```tsx
<TerminalSkeleton lines={3} />
```
✅ Placeholder, pulsing, staggered animation

---

## Advanced Terminals

### AdvancedTerminal
```tsx
<AdvancedTerminal
  message="Running audit..."
  color="green" // green, cyan, amber, purple, pink
  showProgress
  progress={65}
  showSystemInfo
  lines={['Step 1', 'Step 2']}
/>
```
✅ Colors, progress, system info, multi-line

### MatrixTerminal
```tsx
<MatrixTerminal duration={3} />
```
✅ Hacker matrix rain effect, cascading chars

### GlitchTerminal
```tsx
<GlitchTerminal message="SYSTEM_ERROR" />
```
✅ Error state, dynamic glitch effect

### SuccessTerminal
```tsx
<SuccessTerminal message="Operation completed" />
```
✅ Success indicator, checkmark, green theme

### ErrorTerminal
```tsx
<ErrorTerminal error="Connection failed" />
```
✅ Error state, X indicator, red theme

---

## Status Indicators & Progress

### StatusBadge
```tsx
<StatusBadge
  status="loading" // idle, loading, success, error, warning
  label="Processing"
  size="md" // sm, md, lg
/>
```
✅ Dot indicator, label, animated pulse

### CircularProgress
```tsx
<CircularProgress
  progress={75}
  size="md" // sm, md, lg
  color="green" // green, blue, purple
/>
```
✅ Circular chart, percentage, smooth animation

### LinearProgress
```tsx
<LinearProgress
  progress={75}
  label="Uploading"
  color="blue" // green, blue, purple, red
/>
```
✅ Progress bar, label, smooth transitions

### PulsingIndicator
```tsx
<PulsingIndicator
  color="green" // green, blue, red, yellow
  label="Connected"
/>
```
✅ Pulsing dot, ring animation, optional label

### StepProgress
```tsx
<StepProgress
  currentStep={2}
  totalSteps={4}
  steps={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
/>
```
✅ Multi-step tracker, checkmarks, progress bar

### SkeletonLoader
```tsx
<SkeletonLoader
  lines={3}
  variant="default" // default, compact
/>
```
✅ Placeholder, animated pulse, staggered

---

## API Status

### APIStatusIndicator
```tsx
<APIStatusIndicator
  variant="full" // full, compact, inline
  showRequired={true}
/>
```
✅ Shows: Google, AI Provider, PageSpeed, WordPress
✅ Variants: full detail, compact grid, inline text

---

## Imports

```typescript
// Crawl Progress
import { CrawlProgressLive } from '@/app/components/crawl-progress-live';

// Terminal Loaders
import {
  TerminalLoader,
  TerminalStatus,
  TerminalSkeleton
} from '@/app/components/terminal-loader';

// Advanced Terminals
import {
  AdvancedTerminal,
  MatrixTerminal,
  GlitchTerminal,
  SuccessTerminal,
  ErrorTerminal
} from '@/app/components/terminal-advanced';

// Status & Progress
import {
  StatusBadge,
  CircularProgress,
  LinearProgress,
  PulsingIndicator,
  StepProgress,
  SkeletonLoader
} from '@/app/components/status-indicators';

// API Status
import {
  APIStatusIndicator
} from '@/app/components/api-status-indicator';
```

---

## Common Patterns

### Loading with Progress
```tsx
<AdvancedTerminal
  message="Running audit..."
  showProgress
  progress={progress}
  color="cyan"
/>
```

### Multi-Step Workflow
```tsx
<StepProgress
  currentStep={step}
  totalSteps={4}
  steps={['Crawl', 'Analyze', 'Score', 'Report']}
/>
```

### Status Indication
```tsx
<div className="flex items-center gap-2">
  <StatusBadge status={status} />
  <PulsingIndicator color={statusColor} label={statusLabel} />
</div>
```

### Success/Error States
```tsx
{success ? (
  <SuccessTerminal message="Complete" />
) : (
  <ErrorTerminal error="Failed" />
)}
```

### Loading Placeholder
```tsx
{loading ? (
  <TerminalSkeleton lines={5} />
) : (
  <Content />
)}
```

---

## Color Reference

| Color | Use | Classes |
|-------|-----|---------|
| Green | Success, ready, default | `text-green-400`, `bg-green-500` |
| Blue | Loading, info | `text-blue-400`, `bg-blue-500` |
| Cyan | Processing, data | `text-cyan-400`, `bg-cyan-500` |
| Purple | Premium, special | `text-purple-400`, `bg-purple-500` |
| Pink | Highlight, accent | `text-pink-400`, `bg-pink-500` |
| Red | Error, critical | `text-red-400`, `bg-red-500` |
| Yellow | Warning, caution | `text-yellow-400`, `bg-yellow-500` |
| Amber | Attention | `text-amber-400`, `bg-amber-500` |

---

## Size Reference

| Size | Use Cases |
|------|-----------|
| `sm` | Badge, small lists, sidebars |
| `md` | Default, forms, tables (default) |
| `lg` | Hero sections, modals, prominent display |

---

## Animation Speeds

| Component | Duration |
|-----------|----------|
| Typewriter | 30ms per character |
| Cursor blink | 500ms interval |
| Loading dots | 400ms rotation |
| Scan lines | 8s continuous |
| Pulsing | 2s cycle |
| Progress transition | 500ms ease-out |

---

## Demo Pages

- **Basic Loaders**: `/demo/loaders`
- **Advanced Effects**: `/demo/advanced-loaders`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Loader not showing | Wrap in conditional: `{loading && <Loader />}` |
| Colors not applying | Check Tailwind config includes colors |
| Animation too fast/slow | Adjust duration in component code |
| Progress not updating | Ensure state triggers re-render |
| Dark mode not working | Check dark mode CSS is enabled |

---

## Version: 1.0
Last Updated: 2026-04-27
