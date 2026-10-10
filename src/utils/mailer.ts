import config from "../config";
import { HttpError } from "./httpError";
import { createLogger } from "./logger";

const logger = createLogger(config.logLevel);

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export const isMailConfigured = (): boolean =>
  Boolean(config.smtp.host && config.smtp.user && config.smtp.from);

interface Transport {
  sendMail(options: Record<string, unknown>): Promise<unknown>;
  close?(): void;
}
interface NodemailerModule {
  createTransport(options: Record<string, unknown>): Transport;
}

/** Nodemailer wordt lui geladen: zolang het pakket niet geïnstalleerd is of
 *  SMTP niet ingevuld, blijft de rest van de API gewoon draaien en krijgt de
 *  beheerder een duidelijke melding in plaats van een crash bij het opstarten. */
const createTransport = (pool = false): Transport => {
  if (!isMailConfigured()) {
    throw new HttpError(503, "Mail is nog niet ingesteld op de server (SMTP_HOST, SMTP_USER, SMTP_FROM).");
  }
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

const send = (transport: Transport, input: MailInput) =>
  transport.sendMail({
    from: config.smtp.from,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

export const sendMail = async (input: MailInput): Promise<void> => {
  const transport = createTransport();
  await send(transport, input);
  logger.info("Mail sent", { to: input.to, subject: input.subject });
};

export interface BatchResult {
  sent: string[];
  failed: { to: string; error: string }[];
}

/** Veel mails tegelijk over één (gepoolde) verbinding, een paar parallel.
 *  Eén mislukte mail houdt de rest niet tegen. */
export const sendMailBatch = async (inputs: MailInput[], concurrency = 3): Promise<BatchResult> => {
  const transport = createTransport(true);
  const result: BatchResult = { sent: [], failed: [] };
  let next = 0;
  const worker = async () => {
    while (next < inputs.length) {
      const input = inputs[next++];
      try {
        await send(transport, input);
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
  logger.info("Mail batch sent", { sent: result.sent.length, failed: result.failed.length });
  return result;
};
