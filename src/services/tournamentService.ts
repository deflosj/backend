import { Phase, Team } from "@prisma/client";
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
  upsertTournamentRules,
} from "../repositories/tournamentRepository";

// ── Tournaments ───────────────────────────────────────────────────────────────

export const listTournaments = () => findAllTournaments();

export const getTournament = async (id: number) => {
  const t = await findTournamentById(id);
  if (!t) throw new HttpError(404, "Tournament not found");
  return t;
};

export const getActiveTournament = async () => {
  const t = await findActiveTournament();
  if (!t) throw new HttpError(404, "No active tournament");
  return t;
};

export const addTournament = (data: TournamentData) => {
  if (!data.name?.trim()) throw new HttpError(400, "Name is required");
  if (!data.year || data.year < 2000) throw new HttpError(400, "Valid year is required");
  return createTournament({ name: data.name.trim(), year: data.year });
};

export const editTournament = async (id: number, data: Partial<TournamentData>) => {
  await getTournament(id);
  return updateTournament(id, data);
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

export const saveTournamentRules = async (tournamentId: number, description: string) => {
  await getTournament(tournamentId);
  if (!description?.trim()) throw new HttpError(400, "Description is required");
  return upsertTournamentRules(tournamentId, description.trim());
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

export const listTeams = async (tournamentId: number) => {
  await getTournament(tournamentId);
  return findTeamsByTournament(tournamentId);
};

export const getTeam = async (id: number) => {
  const t = await findTeamById(id);
  if (!t) throw new HttpError(404, "Team not found");
  return t;
};

export const addTeam = async (tournamentId: number, data: TeamData) => {
  await getTournament(tournamentId);
  if (!data.name?.trim()) throw new HttpError(400, "Name is required");
  if (!data.captainName?.trim()) throw new HttpError(400, "Captain name is required");
  if (!data.speler1?.trim() || !data.speler2?.trim() || !data.speler3?.trim() || !data.speler4?.trim()) {
    throw new HttpError(400, "All 4 player names are required");
  }
  return createTeam(tournamentId, data);
};

export const editTeam = async (id: number, data: Partial<TeamData>) => {
  await getTeam(id);
  return updateTeam(id, data);
};

export const removeTeam = async (id: number) => {
  await getTeam(id);
  return deleteTeam(id);
};

export const toggleCheckIn = async (id: number, isPresent: boolean) => {
  await getTeam(id);
  return checkInTeam(id, isPresent);
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

export const recordScore = async (matchId: number, scoreA: number, scoreB: number) => {
  await getMatch(matchId);
  if (scoreA < 0 || scoreB < 0) throw new HttpError(400, "Scores must be non-negative");
  return scoreMatch(matchId, scoreA, scoreB);
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
          time: roundTime,
          track: trackBase + matchIdx,
          phase: Phase.GROUP,
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
  const pouleStandings: Team[][] = await Promise.all(
    poules.map((p) => findTeamsByPoule(p.id))
  );

  // Collect advancing teams per poule (top N)
  const advancingByPoule: Team[][] = pouleStandings.map((standing) =>
    standing.slice(0, teamsAdvancing)
  );

  // Collect best Nth-place finishers (position = teamsAdvancing, 0-indexed)
  let extraTeams: Team[] = [];
  if (bestNths > 0) {
    const nthPlace = pouleStandings
      .map((standing) => standing[teamsAdvancing] ?? null)
      .filter((t): t is Team => t !== null)
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
        time: sfTime,
        track: i + 1,
        phase: Phase.SEMI,
        bracketPos: `SF${i + 1}`,
      });
    }

    matchRows.push(
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, time: cfTime, track: 1, phase: Phase.CONSOLATION_FINAL, bracketPos: "CF1" },
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, time: fTime, track: 1, phase: Phase.FINAL, bracketPos: "F1" },
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
        time: qfTime, track: i + 1,
        phase: Phase.QUARTER,
        bracketPos: `QF${i + 1}`,
      });
    }

    for (let i = 0; i < 2; i++) {
      matchRows.push({
        tournamentId, pouleId: null,
        teamAId: null, teamBId: null,
        time: sfTime, track: i + 1,
        phase: Phase.SEMI,
        bracketPos: `SF${i + 1}`,
      });
    }

    matchRows.push(
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, time: cfTime, track: 1, phase: Phase.CONSOLATION_FINAL, bracketPos: "CF1" },
      { tournamentId, pouleId: null, teamAId: null, teamBId: null, time: fTime, track: 1, phase: Phase.FINAL, bracketPos: "F1" },
    );

  } else {
    throw new HttpError(400, "Knockout generation only supports up to 8 advancing teams");
  }

  await bulkCreateMatches(matchRows);
  return { created: matchRows.length, totalAdvancing };
};
