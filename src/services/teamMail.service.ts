import { Match, Poule, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { MailInput, sendMailBatch } from "../utils/mailer";
import {
  findMatchesByTournament,
  findPoulesByTournament,
  findTeamsByTournament,
  findTournamentById,
} from "../repositories/tournamentRepository";
import { portalLinkFor } from "./teamPortal.service";

/**
 * Mail naar de kapiteinen van een toernooi, vanuit de admin.
 * Invulvelden tussen accolades worden per ploeg ingevuld.
 */

export const MAIL_FIELDS = ["ploeg", "kapitein", "poule", "eerste_match", "portaallink"] as const;
export type MailField = (typeof MAIL_FIELDS)[number];

export type MailAudience = "all" | "paid" | "unpaid" | "present" | "absent";

export interface TeamMailInput {
  subject?: string;
  body?: string;
  audience?: MailAudience;
  pouleId?: number | null;
  /** Enkel deze ploegen (bv. één ploeg als test). */
  teamIds?: number[];
  /** false = enkel tonen wie het krijgt en hoe het eruitziet. */
  send?: boolean;
}

const MAX_SUBJECT = 150;
const MAX_BODY = 10_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const when = (d: Date) =>
  d.toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

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
    if (audience === "paid" && !t.isPaid) return false;
    if (audience === "unpaid" && t.isPaid) return false;
    if (audience === "present" && !t.isPresent) return false;
    if (audience === "absent" && t.isPresent) return false;
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
    };
  });

  const recipients = mails.map((m) => ({ teamId: m.teamId, name: m.name, email: m.to }));
  const preview = mails[0] ? { to: mails[0].to, name: mails[0].name, subject: mails[0].subject, text: mails[0].text } : null;

  if (!input.send) return { recipients, skipped, preview, sent: 0, failed: [] as { name: string; email: string; error: string }[] };
  if (mails.length === 0) throw new HttpError(400, "Geen enkele gekozen ploeg heeft een e-mailadres.");

  const result = await sendMailBatch(mails);
  const failed = result.failed.map((f) => {
    const m = mails.find((x) => x.to === f.to);
    return { name: m?.name ?? f.to, email: f.to, error: f.error };
  });
  return { recipients, skipped, preview, sent: result.sent.length, failed };
};
