'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, TrendingUp, BarChart3, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-gray-950 text-gray-100 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-cyan-400">SEO Audit Pro</div>
          <Link
            href="/audit/new"
            className="px-6 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded-lg hover:bg-cyan-500/30 transition-all duration-200"
          >
            Start Free Audit
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-30"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-30"
          style={{ transform: `translateY(${-scrollY * 0.5}px)` }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                Enterprise SEO Analysis
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Completely Free
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Stop paying $99+ monthly for SEO tools. Get Ahrefs-level analysis for free. Crawl your entire website, analyze content performance, track competitors, and monitor rankings in real-time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/audit/new"
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Your Free Audit
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 border border-gray-700 text-gray-300 font-semibold rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300">
                Watch Demo
              </button>
            </div>

            <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Unlimited Audits
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Real-Time Analysis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-400 text-lg">Enterprise-grade SEO analysis with zero cost</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Keyword Research */}
            <div className="group bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="mb-6">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-all duration-300">
                  <TrendingUp className="w-7 h-7 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Keyword Intelligence</h3>
              <p className="text-gray-400 mb-6">
                Extract keywords from Google Search Console. Find quick-win opportunities. Identify keywords ranking 10-30 that can move to top 3 with content updates.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  GSC data analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  Difficulty estimation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  Traffic potential scoring
                </li>
              </ul>
            </div>

            {/* Feature 2: Content Analysis */}
            <div className="group bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="mb-6">
                <div className="w-14 h-14 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-300">
                  <BarChart3 className="w-7 h-7 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Content Scoring</h3>
              <p className="text-gray-400 mb-6">
                Analyze every page for word count, readability, H1/H2 structure, and internal links. Get actionable recommendations to improve content quality.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Readability scoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Word count analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  Issue detection
                </li>
              </ul>
            </div>

            {/* Feature 3: Competitor Analysis */}
            <div className="group bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="mb-6">
                <div className="w-14 h-14 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-all duration-300">
                  <Zap className="w-7 h-7 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Competitor Analysis</h3>
              <p className="text-gray-400 mb-6">
                Compare your metrics against competitors. Identify content gaps. Learn what they are doing right and where you have opportunities.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  Side-by-side comparison
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  Content gap identification
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  Strategy insights
                </li>
              </ul>
            </div>

            {/* Feature 4: Rank Tracking */}
            <div className="group bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="mb-6">
                <div className="w-14 h-14 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-all duration-300">
                  <Shield className="w-7 h-7 text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Rank Tracking</h3>
              <p className="text-gray-400 mb-6">
                Monitor keyword positions over time. Track position changes. Integrate with Google Search Console for automatic keyword syncing.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Position monitoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Trend detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  GSC integration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">See It In Action</h2>
            <p className="text-gray-400 text-lg">Real-time analysis dashboard with instant insights</p>
          </div>

          {/* Dashboard Preview Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Keywords */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300">
              <div className="h-48 bg-gradient-to-b from-cyan-500/20 to-transparent p-6 flex flex-col justify-between">
                <h3 className="text-lg font-bold">Keyword Opportunities</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Quick Wins</span>
                    <span className="font-bold text-cyan-400">8 keywords</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Content */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <div className="h-48 bg-gradient-to-b from-blue-500/20 to-transparent p-6 flex flex-col justify-between">
                <h3 className="text-lg font-bold">Content Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Word Count</span>
                    <span className="font-bold text-blue-400">1,250</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Readability</span>
                    <span className="font-bold text-blue-400">70/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Competitors */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300">
              <div className="h-48 bg-gradient-to-b from-purple-500/20 to-transparent p-6 flex flex-col justify-between">
                <h3 className="text-lg font-bold">Competitor Comparison</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">You vs Competitors</span>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Ahead</span>
                  </div>
                  <p className="text-xs text-gray-500">Content gaps identified: 3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Dashboard Screenshot Area */}
          <div className="mt-12 bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-96 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-400 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl" />
              </div>
              <div className="text-center relative z-10">
                <p className="text-gray-400 mb-4">SEO Intelligence Dashboard</p>
                <p className="text-2xl font-bold text-gray-300">Real-time analysis across 250+ SEO factors</p>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                  Comprehensive keyword research, content analysis, competitor benchmarking, and rank tracking all in one unified dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">250+</div>
              <p className="text-gray-400">SEO Factors Analyzed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">Free</div>
              <p className="text-gray-400">No Credit Card Required</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">Real-Time</div>
              <p className="text-gray-400">Instant Results</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">Unlimited</div>
              <p className="text-gray-400">Audits & Data</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Pricing That Makes Sense</h2>
            <p className="text-gray-400 text-lg">Save 400+ per month compared to other tools</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-2">SEO Audit Pro</h3>
              <p className="text-gray-400 mb-6">Free forever</p>
              <div className="text-4xl font-bold text-cyan-400 mb-8">0</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Keyword research
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Content analysis
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Competitor analysis
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Rank tracking
                </li>
              </ul>
              <Link
                href="/audit/new"
                className="w-full py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded-lg hover:bg-cyan-500/30 transition-all duration-200 text-center font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* Ahrefs */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 opacity-60">
              <h3 className="text-2xl font-bold mb-2">Ahrefs</h3>
              <p className="text-gray-500 mb-6">Lite plan</p>
              <div className="text-4xl font-bold text-gray-400 mb-8">99</div>
              <p className="text-gray-500 text-sm">Similar features</p>
            </div>

            {/* SEMrush */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 opacity-60">
              <h3 className="text-2xl font-bold mb-2">SEMrush</h3>
              <p className="text-gray-500 mb-6">Business plan</p>
              <div className="text-4xl font-bold text-gray-400 mb-8">499</div>
              <p className="text-gray-500 text-sm">Similar features</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-t from-cyan-500/20 to-transparent relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6">Ready to analyze your SEO?</h2>
          <p className="text-xl text-gray-400 mb-8">Get started in seconds. No sign-up required. Completely free.</p>
          <Link
            href="/audit/new"
            className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Start Your Free Audit Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <p>SEO Audit Pro - Enterprise SEO Analysis for Free</p>
            <p>Open Source on GitHub</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
