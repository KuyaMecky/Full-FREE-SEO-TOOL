'use client';

import { TerminalLoader, TerminalStatus, TerminalSkeleton } from '@/app/components/terminal-loader';

export default function TerminalLoadersDemo() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2">Terminal Loader Components</h1>
        <p className="text-gray-400">Active loading indicators with terminal/hacker aesthetic</p>
      </div>

      {/* Full Terminal Loader */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Full Terminal Loader</h2>
          <p className="text-sm text-gray-400 mb-4">Use for important operations, large loading states</p>
        </div>
        <TerminalLoader
          message="Analyzing website structure..."
          subtitle="Scanning 250+ pages for SEO issues"
          variant="full"
        />
      </section>

      {/* Full Terminal Loader Variant 2 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Full Terminal Loader (Different Stage)</h2>
          <p className="text-sm text-gray-400 mb-4">Automatically rotates through stages</p>
        </div>
        <TerminalLoader
          stage={3}
          variant="full"
        />
      </section>

      {/* Compact Terminal Loader */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Compact Terminal Loader</h2>
          <p className="text-sm text-gray-400 mb-4">Use for inline loading, list items</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Checking API status</span>
              <TerminalLoader variant="compact" message="Fetching data" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Processing request</span>
              <TerminalLoader variant="compact" message="Initializing" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Optimizing results</span>
              <TerminalLoader variant="compact" />
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Status */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Terminal Status</h2>
          <p className="text-sm text-gray-400 mb-4">Inline status indicator for quick feedback</p>
        </div>
        <div className="space-y-3">
          <TerminalStatus message="Checking API status" />
          <TerminalStatus message="Connecting to service" />
          <TerminalStatus message="Fetching results" />
          <TerminalStatus message="Compiling data" />
        </div>
      </section>

      {/* Terminal Skeleton */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Terminal Skeleton</h2>
          <p className="text-sm text-gray-400 mb-4">Placeholder for content that's loading</p>
        </div>
        <TerminalSkeleton lines={4} />
      </section>

      {/* Usage Examples */}
      <section className="space-y-4 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold">Usage Examples</h2>

        <div className="space-y-6 text-sm font-mono text-gray-300">
          {/* Example 1 */}
          <div>
            <p className="text-green-400 mb-2">// Full loader for major operations</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { TerminalLoader } from '@/app/components/terminal-loader';

<TerminalLoader
  message="Running SEO audit..."
  subtitle="Analyzing 250+ pages"
  variant="full"
/>`}
            </pre>
          </div>

          {/* Example 2 */}
          <div>
            <p className="text-green-400 mb-2">// Compact loader for inline use</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { TerminalLoader } from '@/app/components/terminal-loader';

<TerminalLoader
  message="Fetching data"
  variant="compact"
/>`}
            </pre>
          </div>

          {/* Example 3 */}
          <div>
            <p className="text-green-400 mb-2">// Status indicator for quick feedback</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { TerminalStatus } from '@/app/components/terminal-loader';

<TerminalStatus message="Checking API status" />`}
            </pre>
          </div>

          {/* Example 4 */}
          <div>
            <p className="text-green-400 mb-2">// Skeleton for placeholder content</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { TerminalSkeleton } from '@/app/components/terminal-loader';

<TerminalSkeleton lines={3} />`}
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4 bg-gray-900 border border-green-700/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-green-400">Features</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Typewriter effect</strong> - Text appears character by character</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Blinking cursor</strong> - Active terminal appearance</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Animated dots</strong> - Shows ongoing processing</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Scan lines</strong> - CRT monitor effect for authenticity</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Multiple variants</strong> - Full, compact, inline, skeleton</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>Responsive</strong> - Works on all screen sizes</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <span><strong>No dependencies</strong> - Pure CSS and React</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
