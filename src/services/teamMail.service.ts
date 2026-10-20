import { Match, Poule, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { MailAttachment, MailInput, sendMailBatch } from "../utils/mailer";
import {
  findMatchesByTournament,
  findPoulesByTournament,
  findTeamsByTournament,
  findTournamentById,
} from "../repositories/tournamentRepository";
import { portalLinkFor } from "./teamPortal.service";
import { isTeamComplete, playerCount } from "../utils/players";

/**
 * Mail naar de kapiteinen van een toernooi, vanuit de admin.
 * Invulvelden tussen accolades worden per ploeg ingevuld.
 */

export const MAIL_FIELDS = ["ploeg", "kapitein", "poule", "eerste_match", "portaallink", "ontbrekend"] as const;
export type MailField = (typeof MAIL_FIELDS)[number];

export type MailAudience = "all" | "incomplete";

export interface TeamMailInput {
  subject?: string;
  body?: string;
  audience?: MailAudience;
  pouleId?: number | null;
  /** Enkel deze ploegen (bv. één ploeg als test). */
  teamIds?: number[];
  /** false = enkel tonen wie het krijgt en hoe het eruitziet. */
  send?: boolean;
  /** Bijlagen voor elke ploeg (bv. het reglement), base64. */
  attachments?: unknown;
}

const MAX_SUBJECT = 150;
const MAX_BODY = 10_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_ATTACHMENTS = 3;
/** Na decoderen; Resend aanvaardt tot 40 MB, maar mailboxen niet altijd. */
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/** Controleert en normaliseert de bijlagen uit de request. */
export const parseAttachments = (raw: unknown): MailAttachment[] => {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new HttpError(400, "Bijlagen hebben een ongeldig formaat.");
  if (raw.length > MAX_ATTACHMENTS) throw new HttpError(400, `Hoogstens ${MAX_ATTACHMENTS} bijlagen.`);
  let total = 0;
  return raw.map((item) => {
    const a = (item ?? {}) as { filename?: unknown; content?: unknown };
    const filename = String(a.filename ?? "")
      .replace(/[\\/\r\n"]/g, "")
      .trim()
      .slice(0, 120);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = ALLOWED_TYPES[ext];
    if (!filename || !contentType) throw new HttpError(400, "Enkel PDF, PNG of JPG als bijlage.");
    const content = String(a.content ?? "").replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
    if (!content || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) throw new HttpError(400, `Bijlage ${filename} is leeg of beschadigd.`);
    total += Math.floor((content.length * 3) / 4);
    if (total > MAX_ATTACHMENT_BYTES) throw new HttpError(400, "De bijlagen zijn samen groter dan 5 MB.");
    return { filename, content, contentType };
  });
};

const when = (d: Date) =>
  d.toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

const missingText = (n: number) => (n <= 0 ? "geen spelers meer" : `${n} speler${n === 1 ? "" : "s"}`);

const fieldsFor = (team: Team, poules: Poule[], matches: Match[], names: Map<number, string>): Record<MailField, string> => {
  const poule = poules.find((p) => p.id === team.pouleId);
  const first = matches
    .filter((m) => (m.teamAId === team.id || m.teamBId === team.id) && m.scheduledAt)
    .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime())[0];
  const opp = first ? names.get((first.teamAId === team.id ? first.teamBId : first.teamAId) ?? 0) : undefined;
  return {
    ploeg: team.name,
    kapitein: team.captainName || team.name,
    poule: poule ? poule.name : "nog niet ingedeeld",
    eerste_match: first
      ? `${when(first.scheduledAt!)}${first.track !== null ? ` op baan ${first.track}` : ""}${opp ? ` tegen ${opp}` : ""}`
      : "het schema volgt nog",
    portaallink: portalLinkFor(team.token),
    ontbrekend: missingText(4 - playerCount(team)),
  };
};

export const fillFields = (text: string, fields: Record<string, string>) =>
  text.replace(/\{([a-z_]+)\}/g, (all, key: string) => (key in fields ? fields[key] : all));

export const mailTeams = async (tournamentId: number, input: TeamMailInput) => {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) throw new HttpError(404, "Toernooi niet gevonden");

  const subject = String(input.subject ?? "").trim();
  const body = String(input.body ?? "").replace(/\r\n/g, "\n").trim();
  if (input.send) {
    if (!subject) throw new HttpError(400, "Een onderwerp is verplicht.");
    if (!body) throw new HttpError(400, "Schrijf eerst een bericht.");
  }
  if (subject.length > MAX_SUBJECT) throw new HttpError(400, `Het onderwerp mag hoogstens ${MAX_SUBJECT} tekens zijn.`);
  if (body.length > MAX_BODY) throw new HttpError(400, "Het bericht is te lang.");
  const attachments = parseAttachments(input.attachments);

  const [teams, poules, matches] = await Promise.all([
    findTeamsByTournament(tournamentId),
    findPoulesByTournament(tournamentId),
    findMatchesByTournament(tournamentId),
  ]);
  const names = new Map(teams.map((t) => [t.id, t.name]));

  const audience = input.audience ?? "all";
  const chosen = teams.filter((t) => {
    if (input.teamIds?.length && !input.teamIds.includes(t.id)) return false;
    if (input.pouleId && t.pouleId !== input.pouleId) return false;
    if (audience === "incomplete" && isTeamComplete(t)) return false;
    return true;
  });
  const withMail = chosen.filter((t) => t.email && EMAIL.test(t.email.trim()));
  const skipped = chosen.filter((t) => !withMail.includes(t)).map((t) => ({ teamId: t.id, name: t.name }));

  const mails: (MailInput & { teamId: number; name: string })[] = withMail.map((t) => {
    const fields = fieldsFor(t, poules, matches, names);
    return {
      teamId: t.id,
      name: t.name,
      to: t.email!.trim(),
      subject: fillFields(subject, fields),
      text: fillFields(body, fields),
      ...(attachments.length ? { attachments } : {}),
    };
  });

  const recipients = mails.map((m) => ({ teamId: m.teamId, name: m.name, email: m.to }));
  const preview = mails[0] ? { to: mails[0].to, name: mails[0].name, subject: mails[0].subject, text: mails[0].text } : null;
  const attached = attachments.map((a) => ({ filename: a.filename, bytes: Math.floor((a.content.length * 3) / 4) }));

  if (!input.send) return { recipients, skipped, preview, attachments: attached, sent: 0, failed: [] as { name: string; email: string; error: string }[] };
  if (mails.length === 0) throw new HttpError(400, "Geen enkele gekozen ploeg heeft een e-mailadres.");

  const result = await sendMailBatch(mails);
  const failed = result.failed.map((f) => {
    const m = mails.find((x) => x.to === f.to);
    return { name: m?.name ?? f.to, email: f.to, error: f.error };
  });
  return { recipients, skipped, preview, attachments: attached, sent: result.sent.length, failed };
};

/**
 * Testmail: enkel de eerste mail (ingevuld voor de eerste ploeg) gaat naar
 * `testTo`, met "[TEST]" in het onderwerp. Bewust een aparte functie en een
 * apart endpoint: deze code kan geen enkele ploeg bereiken. Zonder geldig
 * testadres wordt er niets verstuurd.
 */
export const mailTeamsTest = async (tournamentId: number, input: TeamMailInput, testTo: unknown) => {
  const to = typeof testTo === "string" ? testTo.trim() : "";
  if (!to || !EMAIL.test(to)) throw new HttpError(400, "Vul een geldig testadres in.");

  // Enkel opbouwen (send: false) — nooit versturen via mailTeams.
  const built = await mailTeams(tournamentId, { ...input, send: false });
  if (!built.preview) throw new HttpError(400, "Geen enkele gekozen ploeg heeft een e-mailadres om als voorbeeld te gebruiken.");
  const subject = String(input.subject ?? "").trim();
  const body = String(input.body ?? "").trim();
  if (!subject) throw new HttpError(400, "Een onderwerp is verplicht.");
  if (!body) throw new HttpError(400, "Schrijf eerst een bericht.");

  const attachments = parseAttachments(input.attachments);
  const result = await sendMailBatch([
    {
      to,
      subject: `[TEST] ${built.preview.subject}`,
      text: built.preview.text,
      ...(attachments.length ? { attachments } : {}),
    },
  ]);
  return {
    to,
    basedOn: built.preview.name,
    sent: result.sent.length,
    error: result.failed[0]?.error ?? null,
  };
};
