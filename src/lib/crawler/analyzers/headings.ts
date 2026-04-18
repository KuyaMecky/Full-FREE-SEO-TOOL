import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue } from "../types";

export function analyzeHeadings(
  html: string,
  $: CheerioAPI,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];

  // Get all headings
  const h1s = $("h1");
  const h2s = $("h2");
  const h3s = $("h3");
  const h4s = $("h4");
  const h5s = $("h5");
  const h6s = $("h6");

  // H1 analysis
  const h1Count = h1s.length;
  if (h1Count === 0) {
    issues.push({
      type: "missing-h1",
      severity: "high",
      message: "Page has no H1 heading",
      details: url,
    });
  } else if (h1Count > 1) {
    const h1Texts = h1s
      .map((_, el) => $(el).text().trim())
      .get()
      .join('", "');
    issues.push({
      type: "multiple-h1",
      severity: "medium",
      message: `Page has ${h1Count} H1 headings`,
      details: `H1s: "${h1Texts}"`,
    });
  }

  // H1 length check
  h1s.each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 70) {
      issues.push({
        type: "h1-too-long",
        severity: "low",
        message: `H1 is too long (${text.length} chars)`,
        details: `H1: "${text.substring(0, 70)}..."`,
      });
    }
    if (text.length < 10) {
      issues.push({
        type: "h1-too-short",
        severity: "low",
        message: `H1 is very short (${text.length} chars)`,
        details: `H1: "${text}"`,
      });
    }
  });

  // Heading structure check
  let lastLevel = 0;
  const headingStructure: { level: number; text: string }[] = [];

  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt(el.tagName.toLowerCase().replace("h", ""));
    const text = $(el).text().trim();
    headingStructure.push({ level, text });
  });

  // Check for skipped heading levels
  for (let i = 0; i < headingStructure.length; i++) {
    const current = headingStructure[i];
    const previous = headingStructure[i - 1];

    if (previous) {
      if (current.level > previous.level + 1) {
        issues.push({
          type: "skipped-heading-level",
          severity: "low",
          message: `Skipped from H${previous.level} to H${current.level}`,
          details: `Previous: "${previous.text.substring(0, 50)}..."\nCurrent: "${current.text.substring(0, 50)}..."`,
        });
      }
    }

    // First heading should be H1
    if (i === 0 && current.level !== 1) {
      issues.push({
        type: "first-heading-not-h1",
        severity: "medium",
        message: `First heading is H${current.level}, not H1`,
        details: `Heading: "${current.text}"`,
      });
    }
  }

  // Check for empty headings
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const text = $(el).text().trim();
    if (!text) {
      const tag = el.tagName.toLowerCase();
      issues.push({
        type: "empty-heading",
        severity: "medium",
        message: `Empty ${tag.toUpperCase()} tag found`,
        details: url,
      });
    }
  });

  // Check heading distribution
  const totalHeadings = h1s.length + h2s.length + h3s.length + h4s.length + h5s.length + h6s.length;
  if (totalHeadings === 0) {
    issues.push({
      type: "no-headings",
      severity: "high",
      message: "Page has no heading structure",
      details: "Pages should use headings to organize content",
    });
  }

  return issues;
}
