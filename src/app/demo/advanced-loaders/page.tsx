'use client';

import { useState } from 'react';
import { AdvancedTerminal, MatrixTerminal, GlitchTerminal, SuccessTerminal, ErrorTerminal } from '@/app/components/terminal-advanced';

export default function AdvancedLoadersDemo() {
  const [progress, setProgress] = useState(0);

  // Simulate progress
  const [showProgress, setShowProgress] = useState(false);

  const handleStartProgress = () => {
    setShowProgress(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowProgress(false);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2">Advanced Terminal Loaders</h1>
        <p className="text-gray-400">Enhanced loading states with progress, colors, and effects</p>
      </div>

      {/* Color Variants */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Color Themes</h2>
          <p className="text-sm text-gray-400 mb-4">Choose from 5 terminal color schemes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdvancedTerminal message="Analyzing green channel..." color="green" />
          <AdvancedTerminal message="Scanning cyan networks..." color="cyan" />
          <AdvancedTerminal message="Amber alert system active..." color="amber" />
          <AdvancedTerminal message="Purple frequency detected..." color="purple" />
          <AdvancedTerminal message="Pink wavelength engaging..." color="pink" />
        </div>
      </section>

      {/* Progress Bar */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Progress Terminal</h2>
          <p className="text-sm text-gray-400 mb-4">Track operation progress</p>
        </div>
        <button
          onClick={handleStartProgress}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded mb-4"
        >
          {showProgress ? `Progress: ${Math.round(progress)}%` : 'Start Progress Demo'}
        </button>
        {showProgress && (
          <AdvancedTerminal
            message="Running comprehensive audit..."
            color="green"
            showProgress
            progress={progress}
            lines={[
              'Scanning 250+ pages',
              'Analyzing SEO metrics',
              'Processing recommendations',
            ]}
          />
        )}
      </section>

      {/* System Info Display */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">System Information Terminal</h2>
          <p className="text-sm text-gray-400 mb-4">Display system metrics and stats</p>
        </div>
        <AdvancedTerminal
          message="System diagnostics running..."
          color="cyan"
          showSystemInfo
          lines={['Checking all systems', 'Running tests', 'Ready for operation']}
        />
      </section>

      {/* Matrix Effect */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Matrix Rain Effect</h2>
          <p className="text-sm text-gray-400 mb-4">Hacker aesthetic loading animation</p>
        </div>
        <MatrixTerminal duration={4} />
      </section>

      {/* Glitch Effect */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Glitch Effect</h2>
          <p className="text-sm text-gray-400 mb-4">Error state with dynamic glitch</p>
        </div>
        <GlitchTerminal message="SYSTEM_INITIALIZING" />
      </section>

      {/* Success State */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Success Terminal</h2>
          <p className="text-sm text-gray-400 mb-4">Positive completion state</p>
        </div>
        <SuccessTerminal message="Audit completed successfully" />
      </section>

      {/* Error State */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Error Terminal</h2>
          <p className="text-sm text-gray-400 mb-4">Error notification with details</p>
        </div>
        <ErrorTerminal error="Connection timeout" />
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Full Example - Audit Workflow</h2>
          <p className="text-sm text-gray-400 mb-4">Complete loading sequence</p>
        </div>
        <div className="space-y-4">
          <AdvancedTerminal
            message="Starting SEO audit..."
            color="green"
            lines={['Initializing crawl engine', 'Connecting to domain', 'Beginning analysis']}
          />
          <AdvancedTerminal
            message="Processing results..."
            color="cyan"
            showProgress
            progress={65}
            lines={['Parsing HTML', 'Extracting metadata', 'Computing scores']}
          />
          <SuccessTerminal message="Audit complete - 87/100" />
        </div>
      </section>

      {/* Features Documentation */}
      <section className="space-y-4 bg-gray-900 border border-green-700/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-green-400">Advanced Features</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>5 Color Themes</strong>
              <p className="text-gray-400 text-xs mt-1">Green, Cyan, Amber, Purple, Pink - customizable per component</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Progress Tracking</strong>
              <p className="text-gray-400 text-xs mt-1">Visual progress bar with percentage display</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>System Information</strong>
              <p className="text-gray-400 text-xs mt-1">Display CPU, memory, network, and timestamp data</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Matrix Rain Animation</strong>
              <p className="text-gray-400 text-xs mt-1">Hacker-style cascading characters effect</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Glitch Effect</strong>
              <p className="text-gray-400 text-xs mt-1">Dynamic text glitching for error states</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Success/Error States</strong>
              <p className="text-gray-400 text-xs mt-1">Dedicated components for completion states</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 mt-1">✓</span>
            <div>
              <strong>Multi-line Output</strong>
              <p className="text-gray-400 text-xs mt-1">Display multiple lines of terminal output</p>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Code Examples */}
      <section className="space-y-4 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold">Usage Examples</h2>

        <div className="space-y-6 text-sm font-mono text-gray-300">
          {/* Example 1 */}
          <div>
            <p className="text-green-400 mb-2">// Basic advanced terminal with color</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { AdvancedTerminal } from '@/app/components/terminal-advanced';

<AdvancedTerminal
  message="Processing data..."
  color="cyan"
  lines={['Scanning files', 'Analyzing content']}
/>`}
            </pre>
          </div>

          {/* Example 2 */}
          <div>
            <p className="text-green-400 mb-2">// With progress tracking</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`<AdvancedTerminal
  message="Running audit..."
  showProgress
  progress={65}
  color="green"
/>`}
            </pre>
          </div>

          {/* Example 3 */}
          <div>
            <p className="text-green-400 mb-2">// Success and error states</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { SuccessTerminal, ErrorTerminal } from '@/app/components/terminal-advanced';

{success ? (
  <SuccessTerminal message="Operation completed" />
) : (
  <ErrorTerminal error="Connection failed" />
)}`}
            </pre>
          </div>

          {/* Example 4 */}
          <div>
            <p className="text-green-400 mb-2">// Matrix effect</p>
            <pre className="bg-black p-3 rounded overflow-x-auto text-xs">
{`import { MatrixTerminal } from '@/app/components/terminal-advanced';

<MatrixTerminal duration={5} />`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
