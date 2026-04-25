import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 10, padding: 48, color: "#111" },
  header:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, paddingBottom: 14, borderBottomColor: "#e5e7eb", borderBottomWidth: 1 },
  logo:         { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  subtitle:     { fontSize: 8, color: "#6b7280", marginTop: 2 },
  section:      { marginBottom: 22 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8, paddingBottom: 5, borderBottomColor: "#e5e7eb", borderBottomWidth: 1 },
  kpiRow:       { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpiCard:      { flex: 1, backgroundColor: "#f9fafb", borderRadius: 5, padding: 10, borderColor: "#e5e7eb", borderWidth: 1 },
  kpiValue:     { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  kpiLabel:     { fontSize: 7, color: "#6b7280", marginTop: 2, textTransform: "uppercase" },
  tableRow:     { flexDirection: "row", borderBottomColor: "#f3f4f6", borderBottomWidth: 1, paddingVertical: 5 },
  tableHead:    { backgroundColor: "#f9fafb", fontFamily: "Helvetica-Bold" },
  cell:         { flex: 1, fontSize: 8 },
  cellRight:    { flex: 1, fontSize: 8, textAlign: "right" },
  footer:       { position: "absolute", bottom: 28, left: 48, right: 48, fontSize: 7, color: "#9ca3af", textAlign: "center" },
});

function fmt(n: number): string {
  return n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = typeof body?.type === "string" ? body.type : "gsc";
  const id = typeof body?.id === "string" ? body.id : null;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (type === "gsc" && id) {
    const prop = await prisma.gscProperty.findFirst({
      where: { id, userId: session.id },
      include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
    });
    if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const snap = prop.snapshots[0];
    let queries: Array<{ query: string; impressions: number; clicks: number; position: number }> = [];
    let pages: Array<{ page: string; impressions: number; clicks: number }> = [];
    try { queries = JSON.parse(snap?.byQuery ?? "[]").slice(0, 20); } catch { /* */ }
    try { pages = JSON.parse(snap?.byPage ?? "[]").slice(0, 15); } catch { /* */ }

    const domain = prop.siteUrl.replace(/^https?:\/\//, "").replace(/^sc-domain:/, "").replace(/\/$/, "");

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>SEO Audit Pro</Text>
              <Text style={styles.subtitle}>Search Console Report · {date}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" }}>{domain}</Text>
              <Text style={{ fontSize: 7, color: "#6b7280", textAlign: "right" }}>Last 28 days</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.kpiRow}>
              {[
                { label: "Impressions", value: fmt(snap?.totalImpressions ?? 0) },
                { label: "Clicks",      value: fmt(snap?.totalClicks ?? 0) },
                { label: "Avg. CTR",    value: `${((snap?.avgCtr ?? 0) * 100).toFixed(2)}%` },
                { label: "Avg. Pos.",   value: (snap?.avgPosition ?? 0).toFixed(1) },
              ].map(({ label, value }) => (
                <View key={label} style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{value}</Text>
                  <Text style={styles.kpiLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {queries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Queries</Text>
              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={[styles.cell, { flex: 3 }]}>Query</Text>
                <Text style={styles.cellRight}>Impressions</Text>
                <Text style={styles.cellRight}>Clicks</Text>
                <Text style={styles.cellRight}>Position</Text>
              </View>
              {queries.map((q) => (
                <View key={q.query} style={styles.tableRow}>
                  <Text style={[styles.cell, { flex: 3 }]}>{q.query}</Text>
                  <Text style={styles.cellRight}>{fmt(q.impressions)}</Text>
                  <Text style={styles.cellRight}>{fmt(q.clicks)}</Text>
                  <Text style={styles.cellRight}>{q.position.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          )}

          {pages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Pages</Text>
              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={[styles.cell, { flex: 4 }]}>Page</Text>
                <Text style={styles.cellRight}>Impressions</Text>
                <Text style={styles.cellRight}>Clicks</Text>
              </View>
              {pages.map((p) => (
                <View key={p.page} style={styles.tableRow}>
                  <Text style={[styles.cell, { flex: 4 }]}>{p.page.length > 65 ? "…" + p.page.slice(-62) : p.page}</Text>
                  <Text style={styles.cellRight}>{fmt(p.impressions)}</Text>
                  <Text style={styles.cellRight}>{fmt(p.clicks)}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.footer}>Generated by SEO Audit Pro · Built by KuyaMecky · {date}</Text>
        </Page>
      </Document>
    );

    const buf = await renderToBuffer(doc);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="seo-report-${domain}-${Date.now()}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported report type" }, { status: 400 });
}
