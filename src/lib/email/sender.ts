import nodemailer from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user ?? "noreply@seoauditpro.app";

  if (!host || !user || !pass) return null;

  return { transport: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const cfg = getTransport();
  if (!cfg) {
    console.warn("[email] SMTP not configured — skipping send");
    return false;
  }
  try {
    await cfg.transport.sendMail({ from: cfg.from, to: payload.to, subject: payload.subject, html: payload.html });
    return true;
  } catch (e) {
    console.error("[email] send failed:", e);
    return false;
  }
}

export function taskAssignedEmail(opts: { to: string; assignedBy: string; taskTitle: string; propertyUrl: string; link: string }) {
  return {
    to: opts.to,
    subject: `New task assigned: ${opts.taskTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h2 style="font-size:18px;margin-bottom:8px">You have a new task</h2>
        <p style="color:#555;margin-bottom:16px"><strong>${opts.assignedBy}</strong> assigned you a task on <strong>${opts.propertyUrl}</strong>.</p>
        <div style="background:#f4f4f4;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="font-weight:600;margin:0">${opts.taskTitle}</p>
        </div>
        <a href="${opts.link}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">View task</a>
        <p style="color:#999;font-size:12px;margin-top:24px">SEO Audit Pro · Built by KuyaMecky</p>
      </div>`,
  };
}

export function rankDropEmail(opts: { to: string; keyword: string; oldPos: number; newPos: number; drop: number; siteUrl: string }) {
  return {
    to: opts.to,
    subject: `Rank drop alert: "${opts.keyword}" dropped ${opts.drop} positions`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h2 style="font-size:18px;margin-bottom:8px">⚠️ Ranking drop detected</h2>
        <p style="color:#555;margin-bottom:16px">A keyword dropped significantly on <strong>${opts.siteUrl}</strong>.</p>
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="font-weight:600;margin:0 0 6px">${opts.keyword}</p>
          <p style="margin:0;color:#92400e">Position #${opts.oldPos.toFixed(1)} → #${opts.newPos.toFixed(1)} <strong>(−${opts.drop})</strong></p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/rank-tracker" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">View Rank Tracker</a>
        <p style="color:#999;font-size:12px;margin-top:24px">SEO Audit Pro · Built by KuyaMecky</p>
      </div>`,
  };
}
