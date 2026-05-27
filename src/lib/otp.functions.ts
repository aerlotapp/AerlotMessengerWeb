import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";

const OTP_TTL_MS = 5 * 60 * 1000;

function getSecret(): string {
  return process.env.OTP_SIGNING_SECRET || "aerlot-dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function buildToken(email: string, otp: string, expiresAt: number): string {
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const body = `${email.toLowerCase()}|${otpHash}|${expiresAt}`;
  const sig = sign(body);
  return Buffer.from(`${body}|${sig}`).toString("base64url");
}

function parseToken(token: string):
  | { email: string; otpHash: string; expiresAt: number }
  | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;
    const [email, otpHash, expiresAtStr, sig] = parts;
    const body = `${email}|${otpHash}|${expiresAtStr}`;
    if (sign(body) !== sig) return null;
    return { email, otpHash, expiresAt: Number(expiresAtStr) };
  } catch {
    return null;
  }
}

async function sendResendEmail(to: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[OTP] RESEND_API_KEY missing — OTP will not be emailed. Dev OTP:", otp);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Aerlot <onboarding@resend.dev>",
      to: [to],
      subject: "Your Aerlot premium verification code",
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:16px;">
          <h1 style="color:#990000;margin:0 0 16px;font-size:24px;">Aerlot premium</h1>
          <p style="color:#bbb;margin:0 0 24px;">Your verification code is:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;background:#1a1a1a;padding:20px;border-radius:12px;text-align:center;color:#fff;border:1px solid #990000;">${otp}</div>
          <p style="color:#777;margin:24px 0 0;font-size:13px;">This code expires in 5 minutes.</p>
        </div>
      `,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend failed (${res.status}): ${txt}`);
  }
}

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: z.string().email() }).parse(input))
  .handler(async ({ data }) => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + OTP_TTL_MS;
    const token = buildToken(data.email, otp, expiresAt);
    await sendResendEmail(data.email, otp);
    return { token, expiresAt };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        otp: z.string().regex(/^\d{6}$/),
        token: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const parsed = parseToken(data.token);
    if (!parsed) return { ok: false, error: "Invalid token" };
    if (parsed.email !== data.email.toLowerCase()) return { ok: false, error: "Email mismatch" };
    if (Date.now() > parsed.expiresAt) return { ok: false, error: "Code expired" };
    const candidateHash = crypto.createHash("sha256").update(data.otp).digest("hex");
    if (candidateHash !== parsed.otpHash) return { ok: false, error: "Invalid code" };
    return { ok: true as const };
  });
