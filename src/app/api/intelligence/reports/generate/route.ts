import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId, format = "html" } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: "auditId required" }, { status: 400 });
    }

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        findings: true,
        recommendations: {
          take: 5,
          orderBy: { priority: "desc" },
        },
        contentPerformance: {
          take: 5,
          orderBy: { contentLength: "desc" },
        },
      },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Get priorities
    const prioritiesRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/intelligence/priorities?auditId=${auditId}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    ).then((r) => r.json());

    // Generate HTML report
    const htmlReport = generateHTMLReport({
      audit,
      recommendations: audit.recommendations,
      contentPerformance: audit.contentPerformance,
      priorities: prioritiesRes,
    });

    if (format === "html") {
      return new NextResponse(htmlReport, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="seo-audit-${auditId}.html"`,
        },
      });
    }

    // For PDF, return HTML with print-friendly styles
    return new NextResponse(htmlReport, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="seo-audit-${auditId}.html"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function generateHTMLReport(data: any) {
  const { audit, recommendations, contentPerformance, priorities } = data;
  const now = new Date().toLocaleDateString();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SEO Audit Report - ${audit.domain}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      background: #f5f5f5;
    }
    .container { max-width: 900px; margin: 0 auto; background: white; }
    .cover-page {
      padding: 80px 40px;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .cover-page h1 { font-size: 48px; margin-bottom: 20px; }
    .cover-page p { font-size: 20px; opacity: 0.9; }
    .section {
      padding: 40px;
      border-bottom: 1px solid #eee;
    }
    .section h2 {
      font-size: 28px;
      margin-bottom: 20px;
      color: #667eea;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .metric {
      padding: 20px;
      border-radius: 8px;
      background: #f9f9f9;
      border-left: 4px solid #667eea;
    }
    .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
    .issue {
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #ff6b6b;
      background: #ffe0e0;
      border-radius: 4px;
    }
    .issue-title { font-weight: bold; margin-bottom: 5px; }
    .recommendation {
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #51cf66;
      background: #e6fcf5;
      border-radius: 4px;
    }
    .quick-win {
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #ffd43b;
      background: #fffacd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th { background: #f5f5f5; font-weight: bold; }
    .footer {
      padding: 30px 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Cover Page -->
    <div class="cover-page">
      <h1>SEO Audit Report</h1>
      <p>${audit.domain}</p>
      <p style="margin-top: 30px; opacity: 0.7;">Generated on ${now}</p>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2>Executive Summary</h2>
      <p>This comprehensive SEO audit identifies ${audit.findings.length} issues affecting your website's search visibility. Key findings show significant opportunities for improvement with an estimated ${priorities.totalTrafficRisk}+ clicks/month recovery potential.</p>

      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${audit.findings.length}</div>
          <div class="metric-label">Issues Found</div>
        </div>
        <div class="metric">
          <div class="metric-value">${priorities.quickWins.length}</div>
          <div class="metric-label">Quick Wins</div>
        </div>
        <div class="metric">
          <div class="metric-value">+${priorities.totalTrafficRisk}</div>
          <div class="metric-label">Traffic Potential</div>
        </div>
        <div class="metric">
          <div class="metric-value">${priorities.totalFixTime}h</div>
          <div class="metric-label">Implementation</div>
        </div>
      </div>
    </div>

    <!-- Quick Wins -->
    <div class="section">
      <h2>Quick Wins (1-2 Weeks)</h2>
      <p>These high-impact, low-effort fixes should be your priority. Implement these in the next 1-2 weeks for fast results.</p>
      ${
        priorities.quickWins
          .slice(0, 5)
          .map(
            (win: any) => `
        <div class="quick-win">
          <div class="issue-title">${win.type.replace(/-/g, " ")}</div>
          <div>Affected Pages: ${win.affectedPages} | Estimated Impact: +${win.estimatedTraffic} clicks/month</div>
          <div style="margin-top: 5px; font-size: 12px; color: #666;">Priority: ${win.priority}/10 | Effort: ${Math.round(win.fixComplexity * 0.5)}h</div>
        </div>
      `
          )
          .join("")
      }
    </div>

    <!-- Top Recommendations -->
    <div class="section">
      <h2>Top Recommendations</h2>
      ${
        recommendations
          .slice(0, 5)
          .map(
            (rec: any) => `
        <div class="recommendation">
          <div class="issue-title">${rec.title}</div>
          <div>Impact: ${rec.estimatedImpact} | Time: ${rec.timeInvestment} | ROI: ${rec.impactMetric}</div>
          <div style="margin-top: 10px; font-size: 12px; line-height: 1.8; max-height: 100px; overflow: hidden;">
            ${rec.actionPlan.substring(0, 200)}...
          </div>
        </div>
      `
          )
          .join("")
      }
    </div>

    <!-- Content Performance -->
    ${
      contentPerformance.length > 0
        ? `
    <div class="section">
      <h2>Content Performance</h2>
      <p>Top content by word count. Longer content typically ranks better and gets more traffic.</p>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Word Count</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${contentPerformance
            .slice(0, 10)
            .map(
              (cp: any) => `
          <tr>
            <td>${cp.title || "Page"}</td>
            <td>${cp.contentLength}</td>
            <td>${cp.contentLength > 1000 ? "Optimal" : cp.contentLength > 300 ? "Good" : "Too Short"}</td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- ROI Roadmap -->
    <div class="section">
      <h2>Implementation Roadmap & ROI</h2>

      <h3 style="font-size: 18px; margin: 20px 0 10px; color: #667eea;">Phase 1: Quick Wins (1-2 weeks)</h3>
      <div style="background: #f0f0ff; padding: 15px; border-radius: 8px;">
        <p><strong>Expected Impact:</strong> +${priorities.roiAnalysis.phase1.estimatedImpact}</p>
        <p><strong>Time Required:</strong> ${priorities.roiAnalysis.phase1.timeRequired}</p>
        <p><strong>Issues to Fix:</strong> ${priorities.roiAnalysis.phase1.issues}</p>
      </div>

      <h3 style="font-size: 18px; margin: 20px 0 10px; color: #667eea;">Phase 2: Strategic Improvements (2-4 weeks)</h3>
      <div style="background: #f0f0ff; padding: 15px; border-radius: 8px;">
        <p><strong>Focus:</strong> Higher-impact improvements requiring more investment</p>
        <p><strong>Expected Additional Impact:</strong> 2-3x the Phase 1 results</p>
        <p><strong>Examples:</strong> Content expansion, technical improvements, backlink strategy</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>SEO Audit Report for ${audit.domain}</p>
      <p>Generated on ${now} | Full-FREE-SEO-TOOL.com</p>
      <p style="margin-top: 20px; color: #999;">For questions about this report, please contact your SEO provider.</p>
    </div>
  </div>
</body>
</html>`;
}
