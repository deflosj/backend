import config from "../config";
import { HttpError } from "./httpError";
import { createLogger } from "./logger";

const logger = createLogger(config.logLevel);

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const isMailConfigured = (): boolean =>
  Boolean(config.smtp.host && config.smtp.user && config.smtp.from);

/** Nodemailer wordt lui geladen: zolang het pakket niet geïnstalleerd is of
 *  SMTP niet ingevuld, blijft de rest van de API gewoon draaien en krijgt de
 *  beheerder een duidelijke melding in plaats van een crash bij het opstarten. */
export const sendMail = async (input: MailInput): Promise<void> => {
  if (!isMailConfigured()) {
    throw new HttpError(503, "Mail is nog niet ingesteld op de server (SMTP_HOST, SMTP_USER, SMTP_FROM).");
  }

  // Losjes getypeerd en lui geladen: zo compileert en start de API ook wanneer
  // nodemailer (nog) niet geïnstalleerd is.
  interface Transport {
    sendMail(options: Record<string, unknown>): Promise<unknown>;
  }
  interface NodemailerModule {
    createTransport(options: Record<string, unknown>): Transport;
  }

  let nodemailer: NodemailerModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nodemailer = require("nodemailer") as NodemailerModule;
  } catch {
    throw new HttpError(503, "Mailpakket ontbreekt op de server. Draai `npm install` en probeer opnieuw.");
  }

  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });

  await transport.sendMail({
    from: config.smtp.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  logger.info("Mail sent", { to: input.to, subject: input.subject });
};
