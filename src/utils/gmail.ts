import { createSign, randomBytes } from "node:crypto";

/**
 * Mailen via de Gmail API als een Workspace-gebruiker (bv. info@deflosj.be),
 * met een service account + domain-wide delegation. Loopt over HTTPS, dus
 * werkt ook waar SMTP-poorten dicht staan (Railway). Verzonden mails komen
 * in de "Verzonden"-map van die gebruiker.
 */

export interface GmailConfig {
  /** Inhoud van het JSON-sleutelbestand van het service account. */
  serviceAccountJson: string;
  /** Workspace-gebruiker namens wie gemaild wordt. */
  sender: string;
  /** Volledige From-header, bv. `De Flosj <info@deflosj.be>`. */
  from: string;
}

export interface GmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedKey: { raw: string; key: ServiceAccountKey } | null = null;
let cachedToken: { sender: string; token: string; expiresAt: number } | null = null;

const parseKey = (raw: string): ServiceAccountKey => {
  if (cachedKey?.raw === raw) return cachedKey.key;
  let parsed: Partial<ServiceAccountKey>;
  try {
    // Ook base64 toegelaten, handig als een host geen JSON in een variabele lust.
    const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    parsed = JSON.parse(text) as Partial<ServiceAccountKey>;
  } catch {
    throw new Error("GMAIL_SERVICE_ACCOUNT_JSON is geen geldige JSON.");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GMAIL_SERVICE_ACCOUNT_JSON mist client_email of private_key.");
  }
  const key = { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  cachedKey = { raw, key };
  return key;
};

const getAccessToken = async (cfg: GmailConfig): Promise<string> => {
  if (cachedToken && cachedToken.sender === cfg.sender && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const key = parseKey(cfg.serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: key.client_email, sub: cfg.sender, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${b64url(signer.sign(key.private_key))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    // unauthorized_client = delegation nog niet goedgekeurd in de Workspace-console.
    throw new Error(`Google-token mislukt: ${body.error ?? res.status} ${body.error_description ?? ""}`.trim());
  }
  cachedToken = { sender: cfg.sender, token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return body.access_token;
};

/** RFC 2047: niet-ASCII (é, ë, emoji) veilig in headers. */
const encodeHeader = (value: string) =>
  /^[\x20-\x7E]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

/** Encodeert enkel de naam in `Naam <adres>`. */
const encodeAddress = (value: string) => {
  const m = /^\s*"?(.*?)"?\s*<([^>]+)>\s*$/.exec(value);
  return m && m[1] ? `${encodeHeader(m[1])} <${m[2]}>` : value;
};

const bodyPart = (type: string, content: string) =>
  [
    `Content-Type: ${type}; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(content, "utf8").toString("base64").replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");

const attachmentPart = (a: { filename: string; content: string; contentType?: string }) => {
  const name = encodeHeader(a.filename.replace(/"/g, ""));
  return [
    `Content-Type: ${a.contentType || "application/octet-stream"}; name="${name}"`,
    `Content-Disposition: attachment; filename="${name}"`,
    "Content-Transfer-Encoding: base64",
    "",
    a.content.replace(/\s+/g, "").replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");
};

const buildMime = (cfg: GmailConfig, msg: GmailMessage): string => {
  const headers = [
    `From: ${encodeAddress(cfg.from)}`,
    `To: ${msg.to}`,
    ...(msg.replyTo ? [`Reply-To: ${msg.replyTo}`] : []),
    `Subject: ${encodeHeader(msg.subject)}`,
    "MIME-Version: 1.0",
  ];

  // Het leesbare deel: platte tekst, of tekst + html als alternatief.
  let body: string;
  if (msg.html) {
    const alt = `flosj_${randomBytes(12).toString("hex")}`;
    body = [
      `Content-Type: multipart/alternative; boundary="${alt}"`,
      "",
      `--${alt}`,
      bodyPart("text/plain", msg.text),
      `--${alt}`,
      bodyPart("text/html", msg.html),
      `--${alt}--`,
      "",
    ].join("\r\n");
  } else {
    body = bodyPart("text/plain", msg.text);
  }

  if (!msg.attachments?.length) return [...headers, body].join("\r\n");

  const mixed = `flosj_${randomBytes(12).toString("hex")}`;
  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    "",
    `--${mixed}`,
    body,
    ...msg.attachments.flatMap((a) => [`--${mixed}`, attachmentPart(a)]),
    `--${mixed}--`,
    "",
  ].join("\r\n");
};

export const sendViaGmail = async (cfg: GmailConfig, msg: GmailMessage): Promise<void> => {
  const token = await getAccessToken(cfg);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(cfg.sender)}/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: b64url(buildMime(cfg, msg)) }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`Gmail ${res.status}: ${detail?.error?.message ?? res.statusText}`);
  }
};
