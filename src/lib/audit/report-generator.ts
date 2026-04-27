import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function generateShareableLink(auditId: string, userId: string) {
  // Verify audit belongs to user
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
  });

  if (!audit || audit.userId !== userId) {
    throw new Error("Audit not found or unauthorized");
  }

  // Get or create audit report
  let report = await prisma.auditReport.findUnique({
    where: { auditId },
  });

  if (!report) {
    throw new Error("Audit report not found");
  }

  // Generate unique slug if not exists
  if (!report.shareSlug) {
    let slug = nanoid(8);
    // Ensure unique
    let existing = await prisma.auditReport.findUnique({ where: { shareSlug: slug } });
    while (existing) {
      slug = nanoid(8);
      existing = await prisma.auditReport.findUnique({ where: { shareSlug: slug } });
    }

    report = await prisma.auditReport.update({
      where: { id: report.id },
      data: { shareSlug: slug, isShared: true },
    });
  }

  return report;
}

export async function disableShareableLink(auditId: string, userId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
  });

  if (!audit || audit.userId !== userId) {
    throw new Error("Audit not found or unauthorized");
  }

  return await prisma.auditReport.update({
    where: { auditId },
    data: { isShared: false, shareSlug: null },
  });
}

export async function getPublicAuditReport(shareSlug: string) {
  const report = await prisma.auditReport.findUnique({
    where: { shareSlug: shareSlug },
    include: { audit: true },
  });

  if (!report || !report.isShared) {
    return null;
  }

  // Check if expired
  if (report.expiresAt && report.expiresAt < new Date()) {
    return null;
  }

  // Update view count and last viewed
  await prisma.auditReport.update({
    where: { id: report.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return report;
}

export async function generateHTMLReport(
  audit: any,
  report: any
): Promise<string> {
  const scorecard = JSON.parse(report.scorecard || "{}");
  const actionItems = JSON.parse(report.actionItems || "[]");
  const executive = JSON.parse(report.executiveSummary || "{}");

  const overall = scorecard.overall || Math.round(
    (((scorecard.technical || 0) +
      (scorecard["on-page"] || 0) +
      (scorecard.content || 0) +
      (scorecard["ux-performance"] || 0)) / 4) as number
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Audit — ${audit.siteUrl || "Report"}</title>
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

    .hero-sub {
      color: var(--muted);
      font-size: 14px;
      font-family: var(--mono);
    }

    .meta-row {
      display: flex;
      gap: 32px;
      margin-top: 32px;
      flex-wrap: wrap;
    }

    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; color: var(--muted); text-transform: uppercase; }
    .meta-val { font-family: var(--mono); font-size: 13px; color: var(--accent); }

    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      margin: 0;
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

    .score-label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .score-val {
      font-family: var(--head);
      font-size: 40px;
      font-weight: 800;
      line-height: 1;
    }

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

    .findings { display: flex; flex-direction: column; gap: 12px; }

    .finding {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
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
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .icon-red { background: rgba(239,68,68,0.15); color: var(--danger); }
    .icon-yellow { background: rgba(245,158,11,0.15); color: var(--warn); }
    .icon-green { background: rgba(34,197,94,0.12); color: var(--accent3); }

    .finding-body { flex: 1; }

    .finding-title {
      font-family: var(--head);
      font-weight: 600;
      font-size: 15px;
      color: #fff;
      margin-bottom: 4px;
    }

    .finding-desc { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

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

    .action-list { display: flex; flex-direction: column; gap: 12px; }

    .action-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px 20px;
      display: flex;
      gap: 14px;
    }

    .action-num {
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
      min-width: 24px;
    }

    .action-text { flex: 1; font-size: 14px; color: var(--text); }

    .timestamp {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-tag">SEO Audit Report</div>
    <h1>Full <span>SEO Audit</span></h1>
    <div class="hero-sub">${audit.siteUrl || "Website"}</div>
    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Overall Score</div>
        <div class="meta-val">${overall}/100</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Report Date</div>
        <div class="meta-val">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Pages Crawled</div>
        <div class="meta-val">${audit.pagesCrawled || 0}</div>
      </div>
    </div>
  </div>

  <div class="wrap">
    <div class="section">
      <div class="score-grid">
        <div class="score-card blue">
          <div class="score-label">Overall</div>
          <div class="score-val">${overall}</div>
          <div class="score-desc">Score</div>
        </div>
        <div class="score-card ${getScoreColor(scorecard.technical || 0)}">
          <div class="score-label">Technical</div>
          <div class="score-val">${scorecard.technical || "—"}</div>
          <div class="score-desc">Health</div>
        </div>
        <div class="score-card ${getScoreColor(scorecard["on-page"] || 0)}">
          <div class="score-label">On-Page</div>
          <div class="score-val">${scorecard["on-page"] || "—"}</div>
          <div class="score-desc">Optimization</div>
        </div>
        <div class="score-card ${getScoreColor(scorecard.content || 0)}">
          <div class="score-label">Content</div>
          <div class="score-val">${scorecard.content || "—"}</div>
          <div class="score-desc">Quality</div>
        </div>
      </div>
    </div>

    ${actionItems.length > 0 ? `
    <div class="section">
      <div class="section-head">
        <div class="section-num">01</div>
        <div class="section-title">Priority Actions</div>
      </div>
      <div class="action-list">
        ${actionItems.map((item: any, i: number) => `
          <div class="action-item">
            <div class="action-num">${i + 1}</div>
            <div class="action-text">${item.title || item.description || "Action item"}</div>
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <div class="timestamp">
      Generated on ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
}
