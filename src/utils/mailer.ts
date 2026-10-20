import config from "../config";
import { HttpError } from "./httpError";
import { createLogger } from "./logger";
import { sendViaGmail } from "./gmail";

const logger = createLogger(config.logLevel);

/** Bijlage als base64 (zonder `data:`-prefix). */
export interface MailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

export interface BatchResult {
  sent: string[];
  failed: { to: string; error: string }[];
}

type Provider = "gmail" | "resend" | "smtp";

const configured: Record<Provider, () => boolean> = {
  gmail: () => Boolean(config.gmail.serviceAccountJson && config.gmail.sender),
  resend: () => Boolean(config.resend.apiKey && config.mailFrom),
  smtp: () => Boolean(config.smtp.host && config.smtp.user && config.smtp.from),
};

/** Expliciet via MAIL_PROVIDER, anders de eerste die ingevuld is. */
const pickProvider = (): Provider | null => {
  const wanted = config.mailProvider as Provider;
  if (wanted in configured) return configured[wanted]() ? wanted : null;
  return (["gmail", "resend", "smtp"] as Provider[]).find((p) => configured[p]()) ?? null;
};

export const isMailConfigured = (): boolean => pickProvider() !== null;

const notConfigured = () =>
  new HttpError(
    503,
    "Mail is nog niet ingesteld op de server (GMAIL_SERVICE_ACCOUNT_JSON + GMAIL_SENDER, RESEND_API_KEY + MAIL_FROM, of SMTP_*)."
  );

// ── Gmail API ────────────────────────────────────────────────────────────────

const gmailConfig = () => ({
  serviceAccountJson: config.gmail.serviceAccountJson,
  sender: config.gmail.sender,
  from: config.mailFrom || config.gmail.sender,
});

const gmailBatch = async (inputs: MailInput[], concurrency: number): Promise<BatchResult> => {
  const cfg = gmailConfig();
  const result: BatchResult = { sent: [], failed: [] };
  let next = 0;
  const worker = async () => {
    while (next < inputs.length) {
      const input = inputs[next++];
      try {
        await sendViaGmail(cfg, input);
        result.sent.push(input.to);
      } catch (e) {
        result.failed.push({ to: input.to, error: e instanceof Error ? e.message : String(e) });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, worker));
  return result;
};

// ── Resend (HTTP) ────────────────────────────────────────────────────────────
// Werkt overal, ook op Railway waar uitgaande SMTP-poorten dicht staan.

const RESEND_URL = "https://api.resend.com";

const toResend = (input: MailInput) => ({
  from: config.mailFrom,
  to: [input.to],
  subject: input.subject,
  text: input.text,
  ...(input.html ? { html: input.html } : {}),
  ...(input.replyTo ? { reply_to: input.replyTo } : {}),
  ...(input.attachments?.length
    ? { attachments: input.attachments.map((a) => ({ filename: a.filename, content: a.content })) }
    : {}),
});

const resendRequest = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${RESEND_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(`Resend ${res.status}: ${detail?.message ?? res.statusText}`);
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resend's batch-endpoint kent geen bijlagen: dan één voor één, onder de
 *  limiet van ±2 calls per seconde. 48 ploegen ≈ 30 seconden. */
const resendOneByOne = async (inputs: MailInput[]): Promise<BatchResult> => {
  const result: BatchResult = { sent: [], failed: [] };
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    try {
      await resendRequest("/emails", toResend(input));
      result.sent.push(input.to);
    } catch (e) {
      result.failed.push({ to: input.to, error: e instanceof Error ? e.message : String(e) });
    }
    if (i + 1 < inputs.length) await sleep(550);
  }
  return result;
};

/** Resend's batch-endpoint: max 100 mails per call, ±2 calls per seconde. */
const resendBatch = async (inputs: MailInput[]): Promise<BatchResult> => {
  if (inputs.some((m) => m.attachments?.length)) return resendOneByOne(inputs);
  const result: BatchResult = { sent: [], failed: [] };
  for (let i = 0; i < inputs.length; i += 100) {
    const chunk = inputs.slice(i, i + 100);
    try {
      await resendRequest("/emails/batch", chunk.map(toResend));
      result.sent.push(...chunk.map((m) => m.to));
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      result.failed.push(...chunk.map((m) => ({ to: m.to, error })));
    }
    if (i + 100 < inputs.length) await sleep(600);
  }
  return result;
};

// ── SMTP (lokaal / fallback) ─────────────────────────────────────────────────

interface Transport {
  sendMail(options: Record<string, unknown>): Promise<unknown>;
  close?(): void;
}
interface NodemailerModule {
  createTransport(options: Record<string, unknown>): Transport;
}

const createSmtpTransport = (pool = false): Transport => {
  let nodemailer: NodemailerModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nodemailer = require("nodemailer") as NodemailerModule;
  } catch {
    throw new HttpError(503, "Mailpakket ontbreekt op de server. Draai `npm install` en probeer opnieuw.");
  }
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.password },
    ...(pool ? { pool: true, maxConnections: 3 } : {}),
  });
};

const smtpSend = (transport: Transport, input: MailInput) =>
  transport.sendMail({
    from: config.smtp.from,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      encoding: "base64",
      contentType: a.contentType,
    })),
  });

const smtpBatch = async (inputs: MailInput[], concurrency: number): Promise<BatchResult> => {
  const transport = createSmtpTransport(true);
  const result: BatchResult = { sent: [], failed: [] };
  let next = 0;
  const worker = async () => {
    while (next < inputs.length) {
      const input = inputs[next++];
      try {
        await smtpSend(transport, input);
        result.sent.push(input.to);
      } catch (e) {
        result.failed.push({ to: input.to, error: e instanceof Error ? e.message : String(e) });
      }
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, worker));
  } finally {
    transport.close?.();
  }
  return result;
};

// ── Publieke API ─────────────────────────────────────────────────────────────

export const sendMail = async (input: MailInput): Promise<void> => {
  const provider = pickProvider();
  if (provider === "gmail") await sendViaGmail(gmailConfig(), input);
  else if (provider === "resend") await resendRequest("/emails", toResend(input));
  else if (provider === "smtp") await smtpSend(createSmtpTransport(), input);
  else throw notConfigured();
  invalidateUsage();
  logger.info("Mail sent", { provider, to: input.to, subject: input.subject });
};

/** Veel mails tegelijk. Eén mislukte mail houdt de rest niet tegen. */
export const sendMailBatch = async (inputs: MailInput[], concurrency = 3): Promise<BatchResult> => {
  if (inputs.length === 0) return { sent: [], failed: [] };
  const provider = pickProvider();
  let result: BatchResult;
  if (provider === "gmail") result = await gmailBatch(inputs, concurrency);
  else if (provider === "resend") result = await resendBatch(inputs);
  else if (provider === "smtp") result = await smtpBatch(inputs, concurrency);
  else throw notConfigured();
  invalidateUsage();
  logger.info("Mail batch sent", { provider, sent: result.sent.length, failed: result.failed.length });
  return result;
};

// ── Status (voor de admin) ───────────────────────────────────────────────────

export interface QuotaWindow {
  used: number;
  limit: number | null;
  resetsAt: string | null;
}

export interface MailStatus {
  provider: Provider | null;
  from: string;
  /** Enkel bij Resend: verbruik volgens hun /usage-endpoint. */
  usage: { daily: QuotaWindow | null; monthly: QuotaWindow | null } | null;
  /** Waarom er geen verbruik is (bv. API-key zonder rechten op /usage). */
  usageError?: string;
}

interface ResendUsageWindow { used?: number; limit?: number | null; resets_at?: string | null }

const toWindow = (w?: ResendUsageWindow): QuotaWindow | null =>
  w ? { used: w.used ?? 0, limit: w.limit ?? null, resetsAt: w.resets_at ?? null } : null;

let usageCache: { at: number; value: MailStatus["usage"] } | null = null;

const fetchResendUsage = async (): Promise<MailStatus["usage"]> => {
  // Kort cachen: de pagina mag pollen zonder Resend te bestoken.
  if (usageCache && Date.now() - usageCache.at < 30_000) return usageCache.value;
  const res = await fetch(`${RESEND_URL}/usage`, {
    headers: { Authorization: `Bearer ${config.resend.apiKey}` },
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(
      res.status === 401 || res.status === 403
        ? "De API-key mag het verbruik niet opvragen (geef hem 'Full access' in Resend)."
        : `Resend ${res.status}: ${detail?.message ?? res.statusText}`
    );
  }
  const body = (await res.json()) as { emails?: { daily?: ResendUsageWindow; monthly?: ResendUsageWindow } };
  const value = { daily: toWindow(body.emails?.daily), monthly: toWindow(body.emails?.monthly) };
  usageCache = { at: Date.now(), value };
  return value;
};

/** Na een verzending moet de teller opnieuw opgehaald worden. */
const invalidateUsage = () => { usageCache = null; };

export const getMailStatus = async (): Promise<MailStatus> => {
  const provider = pickProvider();
  const from = provider === "smtp" ? config.smtp.from : config.mailFrom || config.gmail.sender;
  const status: MailStatus = { provider, from, usage: null };
  if (provider === "resend") {
    try {
      status.usage = await fetchResendUsage();
    } catch (e) {
      status.usageError = e instanceof Error ? e.message : String(e);
    }
  }
  return status;
};
