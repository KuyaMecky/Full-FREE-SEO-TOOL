interface AuditFinding {
  severity: "critical" | "high" | "medium" | "low";
  issue: string;
  description: string;
  fix: string;
  affectedPages: number;
  impact: string;
}

interface AuditScore {
  overall: number;
  technical: number;
  onPage: number;
  content: number;
  performance: number;
}

export function generateDetailedHTMLReport(
  domain: string,
  scores: AuditScore,
  findings: AuditFinding[],
  pagesCrawled: number,
  crawlDate: Date
): string {
  // Organize findings by severity
  const critical = findings.filter((f) => f.severity === "critical");
  const high = findings.filter((f) => f.severity === "high");
  const medium = findings.filter((f) => f.severity === "medium");
  const low = findings.filter((f) => f.severity === "low");

  // Calculate priority actions
  const actionItems = [
    ...critical.slice(0, 5),
    ...high.slice(0, 5),
    ...medium.slice(0, 3),
  ];

  const getScoreClass = (score: number) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🔵";
      default:
        return "⚪";
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Audit — ${domain}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f1a;
      --surface: #111827;
      --border: #1e2a3a;
      --accent: #00d4ff;
      --accent2: #ff6b35;
      --accent3: #22c55e;
      --warn: #f59e0b;
      --danger: #ef4444;
      --text: #e2e8f0;
      --muted: #64748b;
      --mono: 'DM Mono', monospace;
      --head: 'Syne', sans-serif;
      --body: 'DM Sans', sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--body);
      font-size: 15px;
      line-height: 1.7;
    }

    .hero {
      background: linear-gradient(135deg, #0b0f1a 0%, #0d1929 50%, #0b1a2b 100%);
      border-bottom: 1px solid var(--border);
      padding: 60px 48px 48px;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -80px; right: -80px;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-tag {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .hero h1 {
      font-family: var(--head);
      font-size: clamp(28px, 4vw, 48px);
      font-weight: 800;
      line-height: 1.1;
      color: #fff;
      margin-bottom: 12px;
    }

    .hero h1 span { color: var(--accent); }
    .hero-sub { color: var(--muted); font-size: 14px; font-family: var(--mono); }

    .meta-row {
      display: flex;
      gap: 32px;
      margin-top: 32px;
      flex-wrap: wrap;
    }

    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; color: var(--muted); text-transform: uppercase; }
    .meta-val { font-family: var(--mono); font-size: 13px; color: var(--accent); font-weight: 600; }

    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
    }

    .score-card {
      background: var(--surface);
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      overflow: hidden;
    }

    .score-card::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
    }

    .score-card.green::after { background: var(--accent3); }
    .score-card.yellow::after { background: var(--warn); }
    .score-card.red::after { background: var(--danger); }
    .score-card.blue::after { background: var(--accent); }

    .score-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
    .score-val { font-family: var(--head); font-size: 40px; font-weight: 800; line-height: 1; }
    .score-card.green .score-val { color: var(--accent3); }
    .score-card.yellow .score-val { color: var(--warn); }
    .score-card.red .score-val { color: var(--danger); }
    .score-card.blue .score-val { color: var(--accent); }
    .score-desc { font-size: 12px; color: var(--muted); }

    .wrap { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
    .section { padding: 48px 0; border-bottom: 1px solid var(--border); }
    .section:last-child { border-bottom: none; }

    .section-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }

    .section-num {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--accent);
      border: 1px solid rgba(0,212,255,0.2);
      padding: 3px 8px;
      border-radius: 3px;
      letter-spacing: 0.1em;
    }

    .section-title {
      font-family: var(--head);
      font-size: 22px;
      font-weight: 700;
      color: #fff;
    }

    .finding {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .finding-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px 20px;
    }

    .finding-icon {
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .icon-critical { background: rgba(239,68,68,0.15); }
    .icon-high { background: rgba(255,107,53,0.15); }
    .icon-medium { background: rgba(245,158,11,0.15); }
    .icon-low { background: rgba(0,212,255,0.1); }

    .finding-body { flex: 1; }
    .finding-title { font-family: var(--head); font-weight: 600; font-size: 15px; color: #fff; margin-bottom: 4px; }
    .finding-desc { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin-bottom: 8px; }
    .finding-impact { font-size: 12px; color: var(--text)/70; }

    .finding-fix {
      background: rgba(0,0,0,0.25);
      border-top: 1px solid var(--border);
      padding: 14px 20px 14px 66px;
    }

    .fix-label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 5px;
    }

    .fix-text { font-size: 13px; color: #94a3b8; }

    .stat-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin-bottom: 12px;
    }

    .stat-number {
      font-family: var(--head);
      font-size: 36px;
      font-weight: 800;
      color: var(--accent);
      line-height: 1;
    }

    .stat-label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-top: 8px;
    }

    .priority-list { display: flex; flex-direction: column; gap: 8px; }
    .priority-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    .priority-rank {
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
      min-width: 24px;
      text-align: center;
    }

    .priority-text { flex: 1; font-size: 14px; }
    .priority-severity {
      font-family: var(--mono);
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 3px;
      background: rgba(0,0,0,0.3);
    }

    .severity-critical { color: var(--danger); }
    .severity-high { color: var(--accent2); }
    .severity-medium { color: var(--warn); }
    .severity-low { color: var(--accent); }

    .findings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .timestamp {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-tag">Full SEO Audit Report</div>
    <h1>Complete <span>SEO Analysis</span></h1>
    <div class="hero-sub">${domain}</div>
    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Overall Score</div>
        <div class="meta-val">${scores.overall}/100</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Pages Analyzed</div>
        <div class="meta-val">${pagesCrawled}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Total Issues</div>
        <div class="meta-val">${findings.length}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Report Date</div>
        <div class="meta-val">${crawlDate.toLocaleDateString()}</div>
      </div>
    </div>
  </div>

  <div class="wrap">
    <!-- Score Cards -->
    <div class="section">
      <div class="score-grid">
        <div class="score-card blue">
          <div class="score-label">Overall</div>
          <div class="score-val">${scores.overall}</div>
          <div class="score-desc">Health Score</div>
        </div>
        <div class="score-card ${getScoreClass(scores.technical)}">
          <div class="score-label">Technical</div>
          <div class="score-val">${scores.technical}</div>
          <div class="score-desc">SEO Health</div>
        </div>
        <div class="score-card ${getScoreClass(scores.onPage)}">
          <div class="score-label">On-Page</div>
          <div class="score-val">${scores.onPage}</div>
          <div class="score-desc">Optimization</div>
        </div>
        <div class="score-card ${getScoreClass(scores.content)}">
          <div class="score-label">Content</div>
          <div class="score-val">${scores.content}</div>
          <div class="score-desc">Quality</div>
        </div>
        <div class="score-card ${getScoreClass(scores.performance)}">
          <div class="score-label">Performance</div>
          <div class="score-val">${scores.performance}</div>
          <div class="score-desc">UX Score</div>
        </div>
      </div>
    </div>

    <!-- Issues by Severity -->
    <div class="section">
      <div class="section-head">
        <div class="section-num">01</div>
        <div class="section-title">Issues Overview</div>
      </div>
      <div class="findings-grid">
        <div class="stat-box">
          <div class="stat-number" style="color: var(--danger);">${critical.length}</div>
          <div class="stat-label">Critical Issues</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: var(--accent2);">${high.length}</div>
          <div class="stat-label">High Priority</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: var(--warn);">${medium.length}</div>
          <div class="stat-label">Medium Issues</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: var(--accent);">${low.length}</div>
          <div class="stat-label">Low Priority</div>
        </div>
      </div>
    </div>

    <!-- Priority Actions -->
    ${actionItems.length > 0 ? `
    <div class="section">
      <div class="section-head">
        <div class="section-num">02</div>
        <div class="section-title">Priority Actions</div>
      </div>
      <div class="priority-list">
        ${actionItems.map((item, i) => `
          <div class="priority-item">
            <div class="priority-rank">${i + 1}</div>
            <div style="flex: 1;">
              <div class="priority-text">${item.issue}</div>
              <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${item.fix.substring(0, 80)}...</div>
            </div>
            <div class="priority-severity severity-${item.severity}">${item.severity.toUpperCase()}</div>
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <!-- Critical Issues -->
    ${critical.length > 0 ? `
    <div class="section">
      <div class="section-head">
        <div class="section-num">03</div>
        <div class="section-title">Critical Issues (${critical.length})</div>
      </div>
      ${critical.map((f) => `
        <div class="finding">
          <div class="finding-header">
            <div class="finding-icon icon-critical">${getSeverityIcon("critical")}</div>
            <div class="finding-body">
              <div class="finding-title">${f.issue}</div>
              <div class="finding-desc">${f.description}</div>
              <div class="finding-impact"><strong>Impact:</strong> ${f.impact}</div>
            </div>
          </div>
          <div class="finding-fix">
            <div class="fix-label">Recommended Fix</div>
            <div class="fix-text">${f.fix}</div>
          </div>
        </div>
      `).join("")}
    </div>
    ` : ""}

    <!-- High Priority Issues -->
    ${high.length > 0 ? `
    <div class="section">
      <div class="section-head">
        <div class="section-num">04</div>
        <div class="section-title">High Priority Issues (${high.length})</div>
      </div>
      ${high.slice(0, 10).map((f) => `
        <div class="finding">
          <div class="finding-header">
            <div class="finding-icon icon-high">${getSeverityIcon("high")}</div>
            <div class="finding-body">
              <div class="finding-title">${f.issue}</div>
              <div class="finding-desc">${f.description}</div>
            </div>
          </div>
          <div class="finding-fix">
            <div class="fix-label">How to Fix</div>
            <div class="fix-text">${f.fix}</div>
          </div>
        </div>
      `).join("")}
      ${high.length > 10 ? `<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 12px;">+ ${high.length - 10} more high priority issues</div>` : ""}
    </div>
    ` : ""}

    <!-- Medium Priority Issues -->
    ${medium.length > 0 ? `
    <div class="section">
      <div class="section-head">
        <div class="section-num">05</div>
        <div class="section-title">Medium Issues (${medium.length})</div>
      </div>
      ${medium.slice(0, 8).map((f) => `
        <div class="finding">
          <div class="finding-header">
            <div class="finding-icon icon-medium">${getSeverityIcon("medium")}</div>
            <div class="finding-body">
              <div class="finding-title">${f.issue}</div>
              <div class="finding-desc">${f.description}</div>
            </div>
          </div>
          <div class="finding-fix">
            <div class="fix-label">Recommendation</div>
            <div class="fix-text">${f.fix}</div>
          </div>
        </div>
      `).join("")}
      ${medium.length > 8 ? `<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 12px;">+ ${medium.length - 8} more medium issues</div>` : ""}
    </div>
    ` : ""}

    <div class="timestamp">
      Comprehensive SEO Audit • Generated on ${crawlDate.toLocaleString()}
    </div>
  </div>
</body>
</html>`;
}
