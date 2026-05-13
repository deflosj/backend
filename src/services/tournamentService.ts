import { Phase } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import {
  activateTournament,
  checkInTeam,
  createMatch,
  createPoule,
  createTeam,
  createTournament,
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
  findTeamById,
  findTeamsByTournament,
  findTiebreakerByTournament,
  findTournamentById,
  MatchData,
  PouleData,
  scoreMatch,
  setTiebreakerScore,
  setTiebreakerWinner,
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
