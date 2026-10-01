import { Match, Phase, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import {
  activateTournament,
  bulkCreateMatches,
  checkInTeam,
  createMatch,
  createPoule,
  createTeam,
  createTournament,
  deleteGroupMatchesByTournament,
  deleteKnockoutMatches,
  deleteMatch,
  deletePoule,
  deleteTeam,
  deleteTournament,
  findActiveTournament,
  findAllTournaments,
  findMatchById,
  findMatchesByTournament,
  findPouleById,
  findPoulesByTournament,
  findPoulesWithTeams,
  findTeamById,
  findTeamsByPoule,
  findMatchByBracketPos,
  computeTeamStats,
  TeamStats,
  TeamStanding,
  findTeamsByTournament,
  findTiebreakerByTournament,
  findTournamentById,
  MatchData,
  PouleData,
  scoreMatch,
  setTiebreakerScore,
  setTiebreakerWinner,
  shiftFutureMatchTimes,
  TeamData,
  TournamentData,
  updateMatch,
  updatePoule,
  updateTeam,
  updateTournament,
  upsertTiebreaker,
  updateTournamentRules,
} from "../repositories/tournamentRepository";

// ── Serialisatie ──────────────────────────────────────────────────────────────

const ZERO_STATS: TeamStats = {
  played: 0, won: 0, drawn: 0, lost: 0,
  goalsFor: 0, goalsAgainst: 0, saldo: 0, points: 0,
};

/** Een team zoals de frontend het verwacht: platte velden plus de berekende
 *  stand. `token` en `email` gaan er alleen uit voor wie het toernooi beheert —
 *  wie de token heeft, kan het team aanpassen. */
export const serializeTeam = (
  team: Team,
  stats: TeamStats = ZERO_STATS,
  includeSecrets = false
) => {
  const { token, email, phone, ...rest } = team;
  return {
    ...rest,
    ...stats,
    ...(includeSecrets ? { token, email, phone } : {}),
  };
};

/** Stand per team, berekend uit de poulewedstrijden van dit toernooi. */
const statsForTeams = (teams: Team[], matches: Match[]): Map<number, TeamStats> =>
  computeTeamStats(
    teams.map((t) => t.id),
    matches.filter((m) => m.phase === Phase.GROUP_STAGE)
  );

const serializeTournament = <T extends { teams: Team[]; matches: Match[] }>(
  tournament: T,
  includeSecrets: boolean
) => {
  const statsMap = statsForTeams(tournament.teams, tournament.matches);
  return {
    ...tournament,
    teams: tournament.teams.map((t) => serializeTeam(t, statsMap.get(t.id) ?? ZERO_STATS, includeSecrets)),
  };
};

// ── Tournaments ───────────────────────────────────────────────────────────────

export const listTournaments = () => findAllTournaments();

/** Kale rij, voor intern gebruik (bestaanscontroles, instellingen lezen). */
export const getTournament = async (id: number) => {
  const t = await findTournamentById(id);
  if (!t) throw new HttpError(404, "Tournament not found");
  return t;
};

/** Wat de API teruggeeft: inclusief de berekende standen. */
export const getTournamentView = async (id: number, includeSecrets = false) =>
  serializeTournament(await getTournament(id), includeSecrets);

export const getActiveTournament = async (includeSecrets = false) => {
  const t = await findActiveTournament();
  if (!t) throw new HttpError(404, "No active tournament");
  return serializeTournament(t, includeSecrets);
};

export const addTournament = (data: TournamentData) => {
  if (!data.name?.trim()) throw new HttpError(400, "Name is required");
  if (!data.year || data.year < 2000) throw new HttpError(400, "Valid year is required");
  return createTournament({ name: data.name.trim(), year: data.year });
};

export const editTournament = async (id: number, data: Partial<TournamentData>) => {
  await getTournament(id);
  await updateTournament(id, data);
  return getTournamentView(id, true);
};

export const removeTournament = async (id: number) => {
  await getTournament(id);
  return deleteTournament(id);
};

export const setActiveTournament = async (id: number) => {
  await getTournament(id);
  return activateTournament(id);
};

// ── Rules ─────────────────────────────────────────────────────────────────────

export const saveTournamentRules = async (tournamentId: number, rules: string) => {
  await getTournament(tournamentId);
  if (!rules?.trim()) throw new HttpError(400, "Rules are required");
  return updateTournamentRules(tournamentId, rules.trim());
};

// ── Poules ────────────────────────────────────────────────────────────────────

export const listPoules = async (tournamentId: number) => {
  await getTournament(tournamentId);
  return findPoulesByTournament(tournamentId);
};

export const getPoule = async (id: number) => {
  const p = await findPouleById(id);
  if (!p) throw new HttpError(404, "Poule not found");
  return p;
};

export const addPoule = async (tournamentId: number, data: PouleData) => {
  await getTournament(tournamentId);
  if (!data.name?.trim()) throw new HttpError(400, "Name is required");
  return createPoule(tournamentId, { ...data, name: data.name.trim() });
};

export const editPoule = async (id: number, data: Partial<PouleData>) => {
  await getPoule(id);
  return updatePoule(id, data);
};

export const removePoule = async (id: number) => {
  await getPoule(id);
  return deletePoule(id);
};

// ── Teams ─────────────────────────────────────────────────────────────────────

export const listTeams = async (tournamentId: number, includeSecrets = false) => {
  const tournament = await getTournament(tournamentId);
  const statsMap = statsForTeams(tournament.teams, tournament.matches);
  const teams = await findTeamsByTournament(tournamentId);
  return teams.map((t) => serializeTeam(t, statsMap.get(t.id) ?? ZERO_STATS, includeSecrets));
};

/** Kale teamrij — intern, en de enige plek waar `token` gewoon meekomt. */
export const getTeamRow = async (id: number): Promise<Team> => {
  const t = await findTeamById(id);
  if (!t) throw new HttpError(404, "Team not found");
  return t;
};

export const getTeam = async (id: number, includeSecrets = false) => {
  const team = await getTeamRow(id);
  const tournament = await getTournament(team.tournamentId);
  const statsMap = statsForTeams(tournament.teams, tournament.matches);
  return serializeTeam(team, statsMap.get(team.id) ?? ZERO_STATS, includeSecrets);
};

const trimTeamInput = (data: Partial<TeamData>): Partial<TeamData> => {
  const out: Partial<TeamData> = { ...data };
  for (const key of ["name", "captainName", "speler1", "speler2", "speler3", "speler4"] as const) {
    const value = out[key];
    if (typeof value === "string") out[key] = value.trim();
  }
  if (typeof out.email === "string") out.email = out.email.trim() || null;
  if (typeof out.phone === "string") out.phone = out.phone.trim() || null;
  // Betaalwijze: CASH of PAYCONIQ. Een betaalwijze kiezen = betaald;
  // "niet betaald" wist de betaalwijze.
  if (out.paymentMethod !== undefined) {
    const m = out.paymentMethod ? String(out.paymentMethod).toUpperCase() : null;
    if (m !== null && m !== "CASH" && m !== "PAYCONIQ") throw new HttpError(400, "Ongeldige betaalwijze");
    out.paymentMethod = m;
    if (m) out.isPaid = true;
  }
  if (out.isPaid === false) out.paymentMethod = null;
  return out;
};

export const addTeam = async (tournamentId: number, data: TeamData) => {
  await getTournament(tournamentId);
  const clean = trimTeamInput(data) as TeamData;
  if (!clean.name) throw new HttpError(400, "Name is required");
  // Spelersnamen zijn bewust optioneel: aan de balie tik je enkel teamnaam,
  // kapitein en betaald in — de ploeg vult de rest zelf aan via het portaal.
  const team = await createTeam(tournamentId, clean);
  return serializeTeam(team, ZERO_STATS, true);
};

export const editTeam = async (id: number, data: Partial<TeamData>, includeSecrets = true) => {
  await getTeamRow(id);
  const clean = trimTeamInput(data);
  if (clean.name !== undefined && !clean.name) throw new HttpError(400, "Name is required");
  await updateTeam(id, clean);
  return getTeam(id, includeSecrets);
};

export const removeTeam = async (id: number) => {
  await getTeamRow(id);
  return deleteTeam(id);
};

export const toggleCheckIn = async (id: number, isPresent: boolean) => {
  await getTeamRow(id);
  await checkInTeam(id, isPresent);
  return getTeam(id, true);
};

// ── Matches ───────────────────────────────────────────────────────────────────

export const listMatches = async (
  tournamentId: number,
  filters?: { phase?: Phase; pouleId?: number }
) => {
  await getTournament(tournamentId);
  return findMatchesByTournament(tournamentId, filters);
};

export const getMatch = async (id: number) => {
  const m = await findMatchById(id);
  if (!m) throw new HttpError(404, "Match not found");
  return m;
};

export const addMatch = async (tournamentId: number, data: MatchData) => {
  await getTournament(tournamentId);
  return createMatch(tournamentId, data);
};

export const editMatch = async (id: number, data: Partial<MatchData>) => {
  await getMatch(id);
  return updateMatch(id, data);
};

export const removeMatch = async (id: number) => {
  await getMatch(id);
  return deleteMatch(id);
};

/** Waar de winnaar (en bij de halve finales ook de verliezer) van een
 *  bracketwedstrijd terechtkomt. Sluit aan op de bracketPos-namen die
 *  `generateKnockout` uitdeelt. */
const BRACKET_FLOW: Record<string, { winner?: [string, "A" | "B"]; loser?: [string, "A" | "B"] }> = {
  QF1: { winner: ["SF1", "A"] },
  QF2: { winner: ["SF1", "B"] },
  QF3: { winner: ["SF2", "A"] },
  QF4: { winner: ["SF2", "B"] },
  SF1: { winner: ["F1", "A"], loser: ["CF1", "A"] },
  SF2: { winner: ["F1", "B"], loser: ["CF1", "B"] },
};

const placeInBracket = async (
  tournamentId: number,
  target: [string, "A" | "B"],
  teamId: number | null
) => {
  const [bracketPos, slot] = target;
  const next = await findMatchByBracketPos(tournamentId, bracketPos);
  if (!next) return;
  await updateMatch(next.id, slot === "A" ? { teamAId: teamId } : { teamBId: teamId });
};

/** Zet de winnaar in de volgende ronde. Draait ook bij een verbetering van een
 *  score opnieuw, zodat een rechtzetting automatisch doorloopt. */
const propagateKnockout = async (match: Match) => {
  if (!match.bracketPos) return;
  const flow = BRACKET_FLOW[match.bracketPos];
  if (!flow) return;

  const winnerId = match.winnerId;
  const loserId =
    winnerId === null ? null : winnerId === match.teamAId ? match.teamBId : match.teamAId;

  if (flow.winner) await placeInBracket(match.tournamentId, flow.winner, winnerId);
  if (flow.loser) await placeInBracket(match.tournamentId, flow.loser, loserId);
};

export const recordScore = async (matchId: number, scoreA: number, scoreB: number) => {
  await getMatch(matchId);
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) throw new HttpError(400, "Scores must be whole numbers");
  if (scoreA < 0 || scoreB < 0) throw new HttpError(400, "Scores must be non-negative");
  const scored = await scoreMatch(matchId, scoreA, scoreB);
  await propagateKnockout(scored);
  return scored;
};

// ── Tiebreaker ────────────────────────────────────────────────────────────────

export const getTiebreaker = async (tournamentId: number) => {
  await getTournament(tournamentId);
  return findTiebreakerByTournament(tournamentId);
};

export const saveTiebreaker = async (tournamentId: number, teamIds: number[]) => {
  await getTournament(tournamentId);
  if (!teamIds?.length) throw new HttpError(400, "At least one team is required");
  return upsertTiebreaker(tournamentId, teamIds);
};

export const resolveTiebreakerWinner = async (tournamentId: number, winnerId: number) => {
  const tb = await getTiebreaker(tournamentId);
  if (!tb) throw new HttpError(404, "No tiebreaker for this tournament");
  return setTiebreakerWinner(tournamentId, winnerId);
};

export const recordTiebreakerScore = async (
  tournamentId: number,
  teamId: number,
  score: number
) => {
  const tb = await getTiebreaker(tournamentId);
  if (!tb) throw new HttpError(404, "No tiebreaker for this tournament");
  if (score < 0) throw new HttpError(400, "Score must be non-negative");
  return setTiebreakerScore(tb.id, teamId, score);
};

// ── Match generation ──────────────────────────────────────────────────────────

function buildRoundRobinRounds(teams: Team[]): Array<Array<[Team, Team]>> {
  const n = teams.length;
  if (n < 2) return [];

  if (n === 4) {
    return [
      [[teams[0], teams[2]], [teams[1], teams[3]]],
      [[teams[0], teams[1]], [teams[2], teams[3]]],
      [[teams[0], teams[3]], [teams[1], teams[2]]],
    ];
  }

  // General circle method for any even/odd team count
  const circle: (Team | null)[] = [...teams];
  const hasBye = n % 2 !== 0;
  if (hasBye) circle.push(null);

  const size = circle.length;
  const fixed = circle[0];
  let rotating = circle.slice(1);
  const rounds: Array<Array<[Team, Team]>> = [];

  for (let r = 0; r < size - 1; r++) {
    const round: Array<[Team, Team]> = [];
    const a = fixed, b = rotating[0];
    if (a !== null && b !== null) round.push([a, b]);

    for (let i = 1; i <= Math.floor((size - 1) / 2); i++) {
      const x = rotating[i], y = rotating[size - 1 - i];
      if (x !== null && y !== null) round.push([x, y]);
    }

    rounds.push(round);
    rotating = [...rotating.slice(-1), ...rotating.slice(0, -1)];
  }

  return rounds;
}

export const generateGroupMatches = async (
  tournamentId: number,
  params: { startTime: Date; slotMinutes: number; firstTrack?: number }
) => {
  await getTournament(tournamentId);
  const poules = await findPoulesWithTeams(tournamentId);

  if (poules.length === 0) throw new HttpError(400, "No group-phase poules found");
  if (poules.some((p) => p.teams.length < 2)) throw new HttpError(400, "Every poule must have at least 2 teams");

  await deleteGroupMatchesByTournament(tournamentId);

  const slotMs = params.slotMinutes * 60 * 1000;
  let nextTrack = params.firstTrack ?? 1;
  const matchRows: Parameters<typeof bulkCreateMatches>[0] = [];

  // Track how many simultaneous slots we need across all poules per round
  // All poules play round 1 simultaneously, round 2 simultaneously, etc.
  // Tracks are assigned: poule 0 gets tracks [T, T+1], poule 1 gets [T+2, T+3], etc.

  const pouleTrackStart: number[] = [];
  for (const poule of poules) {
    const tracksNeeded = Math.floor(poule.teams.length / 2);
    pouleTrackStart.push(nextTrack);
    nextTrack += tracksNeeded;
  }

  // Determine max rounds across all poules
  const allRounds = poules.map((p) => buildRoundRobinRounds(p.teams));
  const maxRounds = Math.max(...allRounds.map((r) => r.length));

  for (let roundIdx = 0; roundIdx < maxRounds; roundIdx++) {
    const roundTime = new Date(params.startTime.getTime() + roundIdx * slotMs);

    for (let pouleIdx = 0; pouleIdx < poules.length; pouleIdx++) {
      const poule = poules[pouleIdx];
      const rounds = allRounds[pouleIdx];
      if (roundIdx >= rounds.length) continue;

      const matchPairs = rounds[roundIdx];
      const trackBase = pouleTrackStart[pouleIdx];

      for (let matchIdx = 0; matchIdx < matchPairs.length; matchIdx++) {
        const [teamA, teamB] = matchPairs[matchIdx];
        matchRows.push({
          tournamentId,
          pouleId: poule.id,
          teamAId: teamA.id,
          teamBId: teamB.id,
          scheduledAt: roundTime,
          track: trackBase + matchIdx,
          phase: Phase.GROUP_STAGE,
          bracketPos: null,
        });
      }
    }
  }

  await bulkCreateMatches(matchRows);
  return { created: matchRows.length };
};

// ── Delay ────────────────────────────────────────────────────────────────────

export const applyDelay = async (tournamentId: number, minutes: number) => {
  await getTournament(tournamentId);
  if (!Number.isInteger(minutes) || minutes === 0) throw new HttpError(400, "minutes must be a non-zero integer");
  const affected = await shiftFutureMatchTimes(tournamentId, minutes);
  return { shiftedMinutes: minutes, matchesAffected: affected };
};

// ── Knockout generation ───────────────────────────────────────────────────────

export const generateKnockout = async (
  tournamentId: number,
  params: { startTime: Date; slotMinutes: number }
) => {
  const tournament = await getTournament(tournamentId);

  const teamsAdvancing = tournament.teamsAdvancingPerPoule ?? 2;
  const bestNths = tournament.bestNthsAdvancing ?? 0;

  const poules = await findPoulesWithTeams(tournamentId);
  if (poules.length === 0) throw new HttpError(400, "No group-phase poules found");

  // Rank teams per poule
  const pouleStandings: TeamStanding[][] = await Promise.all(
    poules.map((p) => findTeamsByPoule(p.id))
  );

  // Collect advancing teams per poule (top N)
  const advancingByPoule: TeamStanding[][] = pouleStandings.map((standing) =>
    standing.slice(0, teamsAdvancing)
  );

  // Collect best Nth-place finishers (position = teamsAdvancing, 0-indexed)
  let extraTeams: TeamStanding[] = [];
  if (bestNths > 0) {
    const nthPlace = pouleStandings
      .map((standing) => standing[teamsAdvancing] ?? null)
      .filter((t): t is TeamStanding => t !== null)
      .sort((a, b) => b.points - a.points || b.saldo - a.saldo || b.goalsFor - a.goalsFor)
      .slice(0, bestNths);
    extraTeams = nthPlace;
  }

  const totalAdvancing = advancingByPoule.flat().length + extraTeams.length;
  if (totalAdvancing < 2) throw new HttpError(400, "Not enough advancing teams to generate knockout");

  await deleteKnockoutMatches(tournamentId);

  const slotMs = params.slotMinutes * 60 * 1000;
  const matchRows: Parameters<typeof bulkCreateMatches>[0] = [];

  if (totalAdvancing <= 4) {
    // Semi-final structure
    // SF: 1A vs 2B, 1B vs 2A (cross-bracket)
    // CF + Final: empty placeholders
    const numPoules = advancingByPoule.length;
    const sfTime = params.startTime;
    const cfTime = new Date(params.startTime.getTime() + 2 * slotMs);
    const fTime = new Date(params.startTime.getTime() + 3 * slotMs);

    for (let i = 0; i < Math.floor(totalAdvancing / 2); i++) {
      const pouleA = advancingByPoule[i % numPoules] ?? [];
      const pouleB = advancingByPoule[(i + 1) % numPoules] ?? [];
      matchRows.push({
        tournamentId,
        pouleId: null,
        teamAId: pouleA[0]?.id ?? null,
        teamBId: pouleB[1]?.id ?? null,
        scheduledAt: sfTime,
        track: i + 1,
        phase: Phase.SEMI_FINAL,
        bracketPos: `SF${i + 1}`,
      });
    }

    matchRows.push(
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, scheduledAt: cfTime, track: 1, phase: Phase.CONSOLATION_FINAL, bracketPos: "CF1" },
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, scheduledAt: fTime, track: 1, phase: Phase.FINAL, bracketPos: "F1" },
    );

  } else if (totalAdvancing <= 8) {
    // Quarter-final structure
    const allAdvancing = [...advancingByPoule.flat(), ...extraTeams];
    const qfTime = params.startTime;
    const sfTime = new Date(params.startTime.getTime() + slotMs);
    const cfTime = new Date(params.startTime.getTime() + 2 * slotMs);
    const fTime = new Date(params.startTime.getTime() + 3 * slotMs);

    // Pair: 1st vs last, 2nd vs second-to-last, etc.
    const half = Math.ceil(allAdvancing.length / 2);
    for (let i = 0; i < half; i++) {
      matchRows.push({
        tournamentId, pouleId: null,
        teamAId: allAdvancing[i]?.id ?? null,
        teamBId: allAdvancing[allAdvancing.length - 1 - i]?.id ?? null,
        scheduledAt: qfTime, track: i + 1,
        phase: Phase.QUARTER_FINAL,
        bracketPos: `QF${i + 1}`,
      });
    }

    for (let i = 0; i < 2; i++) {
      matchRows.push({
        tournamentId, pouleId: null,
        teamAId: null, teamBId: null,
        scheduledAt: sfTime, track: i + 1,
        phase: Phase.SEMI_FINAL,
        bracketPos: `SF${i + 1}`,
      });
    }

    matchRows.push(
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, scheduledAt: cfTime, track: 1, phase: Phase.CONSOLATION_FINAL, bracketPos: "CF1" },
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, scheduledAt: fTime, track: 1, phase: Phase.FINAL, bracketPos: "F1" },
    );

  } else {
    throw new HttpError(400, "Knockout generation only supports up to 8 advancing teams");
  }

  await bulkCreateMatches(matchRows);
  return { created: matchRows.length, totalAdvancing };
};

// ── Zelf aanmelden (publiek, via QR in het café) ──────────────────────────────

export interface SelfRegisterData {
  name: string;
  captainName: string;
  email?: string | null;
  phone: string;
  speler1?: string;
  speler2?: string;
  speler3?: string;
  speler4?: string;
}

/** Een ploeg schrijft zichzelf in voor het actieve toernooi. Geeft enkel de
 *  portaaltoken terug — daarmee kan de ploeg verder alles zelf aanvullen. */
export const selfRegisterTeam = async (data: SelfRegisterData): Promise<{ token: string; tournamentId: number }> => {
  const t = await findActiveTournament();
  if (!t) throw new HttpError(404, "Er is momenteel geen actief toernooi");
  if (t.status === "COMPLETED" || t.status === "CANCELLED") {
    throw new HttpError(400, "Inschrijvingen voor dit toernooi zijn gesloten");
  }
  if (t.teamEditDeadline && t.teamEditDeadline.getTime() < Date.now()) {
    throw new HttpError(400, "De inschrijvingsdeadline is verstreken");
  }

  const name = String(data.name ?? "").trim().slice(0, 60);
  const captainName = String(data.captainName ?? "").trim().slice(0, 80);
  if (!name) throw new HttpError(400, "Teamnaam is verplicht");
  if (!captainName) throw new HttpError(400, "Naam van de kapitein is verplicht");
  const phone = String(data.phone ?? "").trim().slice(0, 30);
  if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Geef een geldig telefoonnummer op");
  const email = String(data.email ?? "").trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Geef een geldig e-mailadres op");
  if (t.teams.some((x) => x.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new HttpError(409, "Er bestaat al een team met deze naam");
  }

  const p = (v?: string) => String(v ?? "").trim().slice(0, 80);
  const team = await createTeam(t.id, {
    name,
    logoUrl: null,
    pouleId: null,
    captainId: null,
    captainName,
    email,
    phone,
    isPaid: false,
    isPresent: false,
    speler1: p(data.speler1),
    speler2: p(data.speler2),
    speler3: p(data.speler3),
    speler4: p(data.speler4),
  } as TeamData);
  return { token: team.token, tournamentId: t.id };
};
