import { Match, Team } from "@prisma/client";
import config from "../config";
import { HttpError } from "../utils/httpError";
import { sendMail } from "../utils/mailer";
import {
  computeTeamStats,
  findMatchesByTournament,
  findPouleById,
  findTeamByToken,
  findTeamsByTournament,
  findTournamentById,
  updateTeam,
  updateTeamLogo,
} from "../repositories/tournamentRepository";
import { getTeamRow, serializeTeam } from "./tournament.service";

/** Logo's komen al verkleind uit de browser (256px webp). Deze grens is de
 *  vangnetcontrole, niet de bedoeling. */
const MAX_LOGO_BYTES = 300 * 1024;
const MAX_TEAM_NAME = 60;
const MAX_PLAYER_NAME = 60;

export interface TeamPortalInput {
  name?: string;
  speler1?: string;
  speler2?: string;
  speler3?: string;
  speler4?: string;
}

const teamMatches = (matches: Match[], teamId: number): Match[] =>
  matches
    .filter((m) => m.teamAId === teamId || m.teamBId === teamId)
    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());

/** Dit team plus zijn tegenstanders, zodat het portaal namen kan tonen
 *  zonder de volledige teamlijst prijs te geven. */
const opponents = (teams: Team[], matches: Match[], teamId: number) => {
  const ids = new Set<number>([teamId]);
  for (const m of matches) {
    if (m.teamAId) ids.add(m.teamAId);
    if (m.teamBId) ids.add(m.teamBId);
  }
  return teams.filter((t) => ids.has(t.id)).map((t) => ({ id: t.id, name: t.name }));
};

const loadPortal = async (token: string) => {
  const team = await findTeamByToken(token);
  if (!team) throw new HttpError(404, "Deze link is niet (meer) geldig.");

  const tournament = await findTournamentById(team.tournamentId);
  if (!tournament) throw new HttpError(404, "Deze link is niet (meer) geldig.");

  return { team, tournament };
};

const canEditNow = (deadline: Date | null): boolean =>
  deadline === null || Date.now() <= deadline.getTime();

const buildPortalView = async (team: Team) => {
  const tournament = await findTournamentById(team.tournamentId);
  if (!tournament) throw new HttpError(404, "Deze link is niet (meer) geldig.");

  const allMatches = await findMatchesByTournament(tournament.id);
  const mine = teamMatches(allMatches, team.id);
  const statsMap = computeTeamStats(
    tournament.teams.map((t) => t.id),
    allMatches.filter((m) => m.phase === "GROUP_STAGE")
  );
  const poule = team.pouleId ? await findPouleById(team.pouleId) : null;

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      year: tournament.year,
      isActive: tournament.isActive,
    },
    // Bewust zonder token en e-mail: dit antwoord gaat naar iedereen met de link.
    team: serializeTeam(team, statsMap.get(team.id), false),
    poule: poule ? { id: poule.id, name: poule.name } : null,
    matches: mine,
    teams: opponents(tournament.teams, mine, team.id),
    canEdit: canEditNow(tournament.teamEditDeadline),
    editDeadline: tournament.teamEditDeadline?.toISOString() ?? null,
  };
};

export const getTeamPortal = async (token: string) => {
  const { team } = await loadPortal(token);
  return buildPortalView(team);
};

const requireOpen = (deadline: Date | null) => {
  if (!canEditNow(deadline)) {
    throw new HttpError(403, "De aanpassingstermijn is verstreken. Spreek de wedstrijdtafel aan.");
  }
};

export const updateTeamPortal = async (token: string, input: TeamPortalInput) => {
  const { team, tournament } = await loadPortal(token);
  requireOpen(tournament.teamEditDeadline);

  const patch: Record<string, string> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new HttpError(400, "Een teamnaam is verplicht.");
    if (name.length > MAX_TEAM_NAME) throw new HttpError(400, `Een teamnaam mag hoogstens ${MAX_TEAM_NAME} tekens lang zijn.`);

    const siblings = await findTeamsByTournament(tournament.id);
    const clash = siblings.some((t) => t.id !== team.id && t.name.toLowerCase() === name.toLowerCase());
    if (clash) throw new HttpError(409, "Er speelt al een ploeg onder die naam.");

    patch.name = name;
  }

  for (const key of ["speler1", "speler2", "speler3", "speler4"] as const) {
    const value = input[key];
    if (value === undefined) continue;
    const trimmed = value.trim();
    if (trimmed.length > MAX_PLAYER_NAME) throw new HttpError(400, `Een spelersnaam mag hoogstens ${MAX_PLAYER_NAME} tekens lang zijn.`);
    patch[key] = trimmed;
  }

  const updated = Object.keys(patch).length > 0 ? await updateTeam(team.id, patch) : team;
  return buildPortalView(updated);
};

/** Het logo komt binnen als data-URI. Bewust geen bestandsopslag: op een
 *  serverless host overleeft de schijf de volgende deploy niet, en een
 *  externe bucket is kosten die dit niet waard is. */
export const saveTeamPortalLogo = async (token: string, dataUrl: string) => {
  const { team, tournament } = await loadPortal(token);
  requireOpen(tournament.teamEditDeadline);

  if (typeof dataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
    throw new HttpError(400, "Stuur een afbeelding door (png, jpeg of webp).");
  }

  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bytes = Buffer.from(base64, "base64").byteLength;
  if (bytes === 0) throw new HttpError(400, "Die afbeelding is leeg.");
  if (bytes > MAX_LOGO_BYTES) {
    throw new HttpError(413, `Het logo mag hoogstens ${Math.round(MAX_LOGO_BYTES / 1024)} kB groot zijn.`);
  }

  const updated = await updateTeamLogo(team.id, dataUrl);
  return { logoUrl: updated.logoUrl, portal: await buildPortalView(updated) };
};

// ── Portaallink versturen ─────────────────────────────────────────────────────

export const portalLinkFor = (token: string): string =>
  `${config.publicSiteUrl}/mijn-team/${token}`;

/** Mailt de portaallink naar de kapitein. Een meegegeven adres wordt ook
 *  bewaard op het team, zodat je later opnieuw kan sturen zonder het opnieuw
 *  in te tikken. */
export const sendPortalLink = async (teamId: number, email?: string) => {
  const team = await getTeamRow(teamId);
  const address = (email ?? team.email ?? "").trim();
  if (!address) throw new HttpError(400, "Geen e-mailadres om naartoe te sturen.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new HttpError(400, "Dat e-mailadres klopt niet.");

  const tournament = await findTournamentById(team.tournamentId);
  const link = portalLinkFor(team.token);
  const deadline = tournament?.teamEditDeadline
    ? `\n\nJullie kunnen dit aanpassen tot ${tournament.teamEditDeadline.toLocaleString("nl-BE")}.`
    : "";

  await sendMail({
    to: address,
    subject: `${team.name} — vul jullie ploeg aan`,
    text:
      `Dag ${team.captainName || team.name},\n\n` +
      "Via onderstaande link vullen jullie de teamnaam, de vier spelers en een logo aan. " +
      "Geen account nodig — de link is de sleutel, dus je mag hem gerust in de ploeggroep delen.\n\n" +
      `${link}${deadline}\n\n` +
      "Tot op het toernooi!",
  });

  if (email && email.trim() !== team.email) {
    await updateTeam(team.id, { email: email.trim() });
  }

  return { sent: true, link };
};
