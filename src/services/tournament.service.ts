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
  findTeamsByTournament,
  replaceGroupPoules,
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
  countUnscoredGroupMatches,
} from "../repositories/tournamentRepository";
import {
  buildKnockout,
  groupSlotMinutes,
  MAX_KNOCKOUT_TEAMS,
  nextBracketSlot,
  rankQualifiers,
  scheduleGroupStage,
} from "./tournamentScheduling";

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

const parsePositiveInt = (value: unknown, field: string, min = 1, max = 1000): number => {
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${field} must be a whole number between ${min} and ${max}`);
  }
  return n;
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
  const optionalInt = (v: unknown, field: string, min: number, max: number) =>
    v === undefined || v === null || v === "" ? null : parsePositiveInt(v, field, min, max);
  return createTournament({
    name: data.name.trim(),
    year: data.year,
    teamsPerPoule: optionalInt(data.teamsPerPoule, "teamsPerPoule", 2, 16),
    teamsAdvancingPerPoule: optionalInt(data.teamsAdvancingPerPoule, "teamsAdvancingPerPoule", 1, 16),
    bestNthsAdvancing: optionalInt(data.bestNthsAdvancing, "bestNthsAdvancing", 0, 64),
    trackCount: optionalInt(data.trackCount, "trackCount", 1, 40) ?? 6,
  });
};

const KO_SETTINGS = ["knockoutPauseMinutes", "knockoutSlotMinutes", "finalsSlotMinutes", "roundBreakMinutes", "withConsolation"] as const;

export const editTournament = async (id: number, data: Partial<TournamentData>) => {
  await getTournament(id);
  const clean: Partial<TournamentData> = { ...data };
  if (clean.knockoutPauseMinutes !== undefined) clean.knockoutPauseMinutes = parsePositiveInt(clean.knockoutPauseMinutes, "knockoutPauseMinutes", 0, 240);
  if (clean.knockoutSlotMinutes !== undefined && clean.knockoutSlotMinutes !== null) clean.knockoutSlotMinutes = parsePositiveInt(clean.knockoutSlotMinutes, "knockoutSlotMinutes", 5, 180);
  if (clean.finalsSlotMinutes !== undefined) clean.finalsSlotMinutes = parsePositiveInt(clean.finalsSlotMinutes, "finalsSlotMinutes", 5, 180);
  if (clean.roundBreakMinutes !== undefined) clean.roundBreakMinutes = parsePositiveInt(clean.roundBreakMinutes, "roundBreakMinutes", 0, 240);
  await updateTournament(id, clean);
  // Andere doorgang of andere uren? Dan het (nog niet gestarte) schema opnieuw opmaken.
  const affectsKo = KO_SETTINGS.some((k) => clean[k] !== undefined) ||
    clean.teamsAdvancingPerPoule !== undefined || clean.bestNthsAdvancing !== undefined || clean.trackCount !== undefined;
  if (affectsKo) await syncKnockout(id);
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

export const MAX_MOTTO = 60;

const trimTeamInput = (data: Partial<TeamData>): Partial<TeamData> => {
  const out: Partial<TeamData> = { ...data };
  for (const key of ["name", "captainName", "speler1", "speler2", "speler3", "speler4"] as const) {
    const value = out[key];
    if (typeof value === "string") out[key] = value.trim();
  }
  if (typeof out.motto === "string") {
    out.motto = out.motto.trim() || null;
    if (out.motto && out.motto.length > MAX_MOTTO) throw new HttpError(400, `Een motto mag hoogstens ${MAX_MOTTO} tekens lang zijn.`);
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
  const flow = nextBracketSlot(match.bracketPos);
  if (!flow) return;

  const winnerId = match.winnerId;
  const loserId =
    winnerId === null ? null : winnerId === match.teamAId ? match.teamBId : match.teamAId;

  if (flow.winner) await placeInBracket(match.tournamentId, flow.winner, winnerId);
  if (flow.loser) await placeInBracket(match.tournamentId, flow.loser, loserId);
};

export const recordScore = async (matchId: number, scoreA: number, scoreB: number) => {
  const match = await getMatch(matchId);
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) throw new HttpError(400, "Scores must be whole numbers");
  if (scoreA < 0 || scoreB < 0) throw new HttpError(400, "Scores must be non-negative");
  // In de knock-out moet er een winnaar zijn, anders kan niemand doorschuiven.
  if (match.bracketPos && scoreA === scoreB) {
    throw new HttpError(400, "Een knock-outwedstrijd kan niet gelijk eindigen");
  }
  const scored = await scoreMatch(matchId, scoreA, scoreB);
  await propagateKnockout(scored);
  if (scored.phase === Phase.GROUP_STAGE) await syncKnockout(scored.tournamentId);
  return scored;
};

// ── Automatisch knock-outschema ──────────────────────────────────────────────

/** Wanneer en hoe de knock-out gespeeld wordt, uit de instellingen van het
 *  toernooi en het poule-schema. null = nog geen poulewedstrijden. */
export const knockoutPlan = (
  tournament: {
    knockoutPauseMinutes: number;
    knockoutSlotMinutes: number | null;
    finalsSlotMinutes: number;
    roundBreakMinutes: number;
    withConsolation: boolean;
  },
  groupMatches: Match[]
) => {
  const planned = groupMatches.filter((m) => m.scheduledAt);
  if (planned.length === 0) return null;
  const slot = groupSlotMinutes(planned);
  const last = Math.max(...planned.map((m) => m.scheduledAt!.getTime()));
  return {
    startTime: new Date(last + (slot + tournament.knockoutPauseMinutes) * 60_000),
    slotMinutes: tournament.knockoutSlotMinutes ?? slot,
    finalsSlotMinutes: tournament.finalsSlotMinutes,
    breakMinutes: tournament.roundBreakMinutes,
    withConsolation: tournament.withConsolation,
  };
};

/**
 * Houdt het knock-outschema in lijn met de poules, zonder dat iemand op
 * "genereren" moet drukken:
 *  - zodra de laatste poulematch een score heeft, wordt het schema opgemaakt;
 *  - wordt daarna nog een poulescore aangepast, dan wordt het opnieuw geloot;
 *  - eens er een knock-outmatch gespeeld is, blijft alles staan.
 * Tot dan toont de site een voorlopige bracket op basis van de standen.
 */
export const syncKnockout = async (tournamentId: number) => {
  const tournament = await getTournament(tournamentId);
  const all = await findMatchesByTournament(tournamentId);
  const group = all.filter((m) => m.phase === Phase.GROUP_STAGE);
  const ko = all.filter((m) => m.bracketPos);
  if (group.length === 0) return { status: "no-groups" as const };
  if (ko.some((m) => m.scoreA !== null || m.scoreB !== null)) return { status: "started" as const };

  const open = group.filter((m) => m.scoreA === null || m.scoreB === null).length;
  if (open > 0) {
    if (ko.length) await deleteKnockoutMatches(tournamentId);
    return { status: "waiting" as const, open };
  }
  const plan = knockoutPlan(tournament, group);
  if (!plan) return { status: "no-groups" as const };
  const res = await generateKnockout(tournamentId, { ...plan, force: true });
  return { status: "generated" as const, created: res.created };
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

// ── Poule generation ──────────────────────────────────────────────────────────

/** Fisher–Yates: elke volgorde is even waarschijnlijk. */
const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/** A, B, …, Z, AA, AB, … */
const pouleLetter = (index: number): string => {
  let label = "";
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) {
    label = String.fromCodePoint(65 + (n % 26)) + label;
  }
  return label;
};

/** Verdeelt de teams willekeurig over nieuwe poules. Het aantal poules is
 *  ceil(teams / teamsPerPoule); de poules verschillen hoogstens één team in
 *  grootte. Bestaande poules én poulewedstrijden worden gewist. */
export const generatePoules = async (
  tournamentId: number,
  params: { teamsPerPoule?: number; onlyPresent?: boolean } = {}
) => {
  const tournament = await getTournament(tournamentId);
  const teamsPerPoule = params.teamsPerPoule ?? tournament.teamsPerPoule ?? 4;
  if (!Number.isInteger(teamsPerPoule) || teamsPerPoule < 2) {
    throw new HttpError(400, "teamsPerPoule must be an integer of at least 2");
  }

  const allTeams = await findTeamsByTournament(tournamentId);
  const teams = params.onlyPresent ? allTeams.filter((t) => t.isPresent) : allTeams;
  if (teams.length < 2) throw new HttpError(400, "At least 2 teams are needed to generate poules");

  const pouleCount = Math.ceil(teams.length / teamsPerPoule);
  const groups = Array.from({ length: pouleCount }, (_, i) => ({ name: `Poule ${pouleLetter(i)}`, teamIds: [] as number[] }));
  shuffle(teams).forEach((team, i) => groups[i % pouleCount].teamIds.push(team.id));

  if (groups.some((g) => g.teamIds.length < 2)) {
    throw new HttpError(400, "Not enough teams: every poule needs at least 2 teams");
  }

  await replaceGroupPoules(tournamentId, groups);
  return { poules: groups.length, teams: teams.length };
};

/** Plant alle poulewedstrijden over de banen van het terrein. Poules die een
 *  baan delen spelen om beurten (zoals in 2025: baan 1 = poule A en B), zodat
 *  er nooit meer wedstrijden tegelijk zijn dan er banen zijn. */
export const generateGroupMatches = async (
  tournamentId: number,
  params: { startTime: Date; slotMinutes: number; trackCount?: number }
) => {
  const tournament = await getTournament(tournamentId);
  const poules = await findPoulesWithTeams(tournamentId);

  if (poules.length === 0) throw new HttpError(400, "No group-phase poules found");
  if (poules.some((p) => p.teams.length < 2)) throw new HttpError(400, "Every poule must have at least 2 teams");
  if (Number.isNaN(params.startTime.getTime())) throw new HttpError(400, "startTime is invalid");

  const slotMinutes = parsePositiveInt(params.slotMinutes, "slotMinutes", 5, 180);
  const trackCount = parsePositiveInt(params.trackCount ?? tournament.trackCount, "trackCount", 1, 40);

  const planned = scheduleGroupStage(
    poules.map((p) => ({ id: p.id, teamIds: p.teams.map((t) => t.id) })),
    { startTime: params.startTime, slotMinutes, trackCount }
  );

  await deleteGroupMatchesByTournament(tournamentId);
  await bulkCreateMatches(planned.map((m) => ({ ...m, tournamentId })));

  const end = planned.reduce((max, m) => Math.max(max, m.scheduledAt.getTime()), 0);
  return {
    created: planned.length,
    tracksUsed: new Set(planned.map((m) => m.track)).size,
    lastSlotAt: end ? new Date(end) : null,
  };
};

// ── Delay ────────────────────────────────────────────────────────────────────

export const applyDelay = async (tournamentId: number, minutes: number) => {
  await getTournament(tournamentId);
  if (!Number.isInteger(minutes) || minutes === 0) throw new HttpError(400, "minutes must be a non-zero integer");
  const affected = await shiftFutureMatchTimes(tournamentId, minutes);
  return { shiftedMinutes: minutes, matchesAffected: affected };
};

// ── Knockout generation ───────────────────────────────────────────────────────

/** Knock-out: de beste teams worden over alle poules heen gerangschikt
 *  (eersten, dan tweedes, dan de beste n-des) en klassiek gekoppeld: 1 vs 32,
 *  2 vs 31, … — nooit twee teams uit dezelfde poule in de eerste ronde.
 *  Latere rondes worden als lege (TBD) wedstrijden aangemaakt en vullen zich
 *  automatisch wanneer een score wordt ingegeven. */
export const generateKnockout = async (
  tournamentId: number,
  params: {
    startTime: Date;
    slotMinutes: number;
    breakMinutes?: number;
    /** Slotduur vanaf de kwartfinales; leeg = slotMinutes. */
    finalsSlotMinutes?: number;
    trackCount?: number;
    withConsolation?: boolean;
    force?: boolean;
  }
) => {
  const tournament = await getTournament(tournamentId);
  if (Number.isNaN(params.startTime.getTime())) throw new HttpError(400, "startTime is invalid");
  const slotMinutes = parsePositiveInt(params.slotMinutes, "slotMinutes", 5, 180);
  const breakMinutes = parsePositiveInt(params.breakMinutes ?? 0, "breakMinutes", 0, 240);
  const finalsSlotMinutes = parsePositiveInt(params.finalsSlotMinutes ?? slotMinutes, "finalsSlotMinutes", 5, 180);
  const trackCount = parsePositiveInt(params.trackCount ?? tournament.trackCount, "trackCount", 1, 40);

  const poules = await findPoulesWithTeams(tournamentId);
  if (poules.length === 0) throw new HttpError(400, "No group-phase poules found");

  if (!params.force) {
    const open = await countUnscoredGroupMatches(tournamentId);
    if (open > 0) {
      throw new HttpError(409, `Nog ${open} poulewedstrijd${open === 1 ? "" : "en"} zonder score`);
    }
  }

  const standings = await Promise.all(poules.map((p) => findTeamsByPoule(p.id)));
  const seeds = rankQualifiers(
    standings.map((s) =>
      s.map((t) => ({
        teamId: t.id,
        pouleId: t.pouleId ?? 0,
        points: t.points,
        saldo: t.saldo,
        goalsFor: t.goalsFor,
        name: t.name,
      }))
    ),
    tournament.teamsAdvancingPerPoule ?? 2,
    tournament.bestNthsAdvancing ?? 0
  );

  if (seeds.length < 2) throw new HttpError(400, "Not enough advancing teams to generate knockout");
  if (seeds.length > MAX_KNOCKOUT_TEAMS) {
    throw new HttpError(400, `Maximaal ${MAX_KNOCKOUT_TEAMS} teams in de knock-out (nu ${seeds.length})`);
  }

  const planned = buildKnockout(seeds, {
    startTime: params.startTime,
    slotMinutes,
    breakMinutes,
    finalsSlotMinutes,
    trackCount,
    withConsolation: params.withConsolation ?? true,
  });

  await deleteKnockoutMatches(tournamentId);
  await bulkCreateMatches(planned.map((m) => ({ ...m, tournamentId })));

  return {
    created: planned.length,
    totalAdvancing: seeds.length,
    seeds: seeds.map((s, i) => ({ seed: i + 1, teamId: s.teamId, pouleId: s.pouleId })),
  };
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
