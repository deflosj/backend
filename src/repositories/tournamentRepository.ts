import { Match, Phase, Player, Poule, Team, Tiebreaker, TiebreakerTeam, Tournament, TournamentStatus } from "@prisma/client";
import prisma from "../database/prisma";

// ── Tournament ────────────────────────────────────────────────────────────────

export interface TournamentData {
  name: string;
  year: number;
  teamsPerPoule?: number | null;
  teamsAdvancingPerPoule?: number | null;
  bestNthsAdvancing?: number | null;
  status?: TournamentStatus;
}

export const findAllTournaments = (): Promise<Tournament[]> =>
  prisma.tournament.findMany({ orderBy: { year: "desc" } });

export const findTournamentById = (id: number): Promise<(Tournament & { poules: Poule[]; teams: Team[]; matches: Match[] }) | null> =>
  prisma.tournament.findUnique({
    where: { id },
    include: { poules: true, teams: true, matches: true },
  });

export const findActiveTournament = (): Promise<(Tournament & { poules: Poule[]; teams: Team[]; matches: Match[] }) | null> =>
  prisma.tournament.findFirst({
    where: { isActive: true },
    include: { poules: true, teams: true, matches: true },
  });

export const createTournament = (data: TournamentData): Promise<Tournament> =>
  prisma.tournament.create({ data });

export const updateTournament = (id: number, data: Partial<TournamentData>): Promise<Tournament> =>
  prisma.tournament.update({ where: { id }, data });

export const deleteTournament = (id: number): Promise<Tournament> =>
  prisma.tournament.delete({ where: { id } });

export const activateTournament = (id: number): Promise<Tournament> =>
  prisma.$transaction(async (tx) => {
    await tx.tournament.updateMany({ where: { isActive: true }, data: { isActive: false, status: TournamentStatus.COMPLETED } });
    return tx.tournament.update({ where: { id }, data: { isActive: true, status: TournamentStatus.ONGOING } });
  });

// ── Rules ─────────────────────────────────────────────────────────────────────

export const updateTournamentRules = (tournamentId: number, rules: string): Promise<Tournament> =>
  prisma.tournament.update({
    where: { id: tournamentId },
    data: { rules, rulesUpdatedAt: new Date() },
  });

// ── Poules ────────────────────────────────────────────────────────────────────

export interface PouleData {
  name: string;
  description?: string | null;
  phase?: Phase;
}

export const findPoulesByTournament = (tournamentId: number): Promise<(Poule & { teams: TeamWithPlayers[] })[]> =>
  prisma.poule.findMany({
    where: { tournamentId },
    include: { teams: { include: { players: true } } },
    orderBy: { name: "asc" },
  });

export const findPouleById = (id: number): Promise<(Poule & { teams: TeamWithPlayers[] }) | null> =>
  prisma.poule.findUnique({ where: { id }, include: { teams: { include: { players: true } } } });

export const createPoule = (tournamentId: number, data: PouleData): Promise<Poule> =>
  prisma.poule.create({ data: { tournamentId, ...data } });

export const updatePoule = (id: number, data: Partial<PouleData>): Promise<Poule> =>
  prisma.poule.update({ where: { id }, data });

export const deletePoule = (id: number): Promise<Poule> =>
  prisma.poule.delete({ where: { id } });

// ── Teams ─────────────────────────────────────────────────────────────────────

export type TeamWithPlayers = Team & { players: Player[] };

export interface PlayerInput {
  name: string;
  isCaptain?: boolean;
}

export interface TeamData {
  name: string;
  logoUrl?: string | null;
  pouleId?: number | null;
  captainId?: number | null;
  players: PlayerInput[];
}

export const findTeamsByTournament = (tournamentId: number): Promise<TeamWithPlayers[]> =>
  prisma.team.findMany({ where: { tournamentId }, include: { players: true }, orderBy: { name: "asc" } });

export const findTeamById = (id: number): Promise<TeamWithPlayers | null> =>
  prisma.team.findUnique({ where: { id }, include: { players: true } });

export const createTeam = (tournamentId: number, data: TeamData): Promise<TeamWithPlayers> =>
  prisma.team.create({
    data: {
      tournamentId,
      name: data.name,
      logoUrl: data.logoUrl,
      pouleId: data.pouleId,
      captainId: data.captainId,
      players: { create: data.players },
    },
    include: { players: true },
  });

export const updateTeam = (id: number, data: Partial<TeamData>): Promise<TeamWithPlayers> => {
  const { players, ...rest } = data;
  if (players !== undefined) {
    return prisma.$transaction(async (tx) => {
      await tx.player.deleteMany({ where: { teamId: id } });
      return tx.team.update({
        where: { id },
        data: { ...rest, players: { create: players } },
        include: { players: true },
      });
    });
  }
  return prisma.team.update({ where: { id }, data: rest, include: { players: true } });
};

export const deleteTeam = (id: number): Promise<Team> =>
  prisma.team.delete({ where: { id } });

export const checkInTeam = (id: number, isPresent: boolean): Promise<TeamWithPlayers> =>
  prisma.team.update({ where: { id }, data: { isPresent }, include: { players: true } });

// ── Matches ───────────────────────────────────────────────────────────────────

export interface MatchData {
  pouleId?: number | null;
  teamAId?: number | null;
  teamBId?: number | null;
  scheduledAt?: Date;
  track?: number | null;
  phase?: Phase;
  bracketPos?: string | null;
}

export const findMatchesByTournament = (
  tournamentId: number,
  filters?: { phase?: Phase; pouleId?: number }
): Promise<Match[]> =>
  prisma.match.findMany({
    where: { tournamentId, ...filters },
    orderBy: [{ phase: "asc" }, { scheduledAt: "asc" }],
  });

export const findMatchById = (id: number): Promise<Match | null> =>
  prisma.match.findUnique({ where: { id } });

export const createMatch = (tournamentId: number, data: MatchData): Promise<Match> =>
  prisma.match.create({ data: { tournamentId, ...data } });

export const updateMatch = (id: number, data: Partial<MatchData>): Promise<Match> =>
  prisma.match.update({ where: { id }, data });

export const deleteMatch = (id: number): Promise<Match> =>
  prisma.match.delete({ where: { id } });

export const scoreMatch = async (matchId: number, scoreA: number, scoreB: number): Promise<Match> => {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });

  let winnerId: number | null = null;
  if (scoreA > scoreB) winnerId = match.teamAId ?? null;
  else if (scoreB > scoreA) winnerId = match.teamBId ?? null;

  return prisma.match.update({ where: { id: matchId }, data: { scoreA, scoreB, winnerId } });
};

// ── Tiebreaker ────────────────────────────────────────────────────────────────

export const findTiebreakerByTournament = (tournamentId: number): Promise<(Tiebreaker & { teams: TiebreakerTeam[] }) | null> =>
  prisma.tiebreaker.findUnique({
    where: { tournamentId },
    include: { teams: true },
  });

export const upsertTiebreaker = async (tournamentId: number, teamIds: number[]): Promise<Tiebreaker & { teams: TiebreakerTeam[] }> =>
  prisma.$transaction(async (tx) => {
    const tiebreaker = await tx.tiebreaker.upsert({
      where: { tournamentId },
      create: { tournamentId },
      update: {},
    });

    // Replace team entries
    await tx.tiebreakerTeam.deleteMany({ where: { tiebreakerId: tiebreaker.id } });
    await tx.tiebreakerTeam.createMany({
      data: teamIds.map((teamId) => ({ tiebreakerId: tiebreaker.id, teamId })),
    });

    return tx.tiebreaker.findUniqueOrThrow({
      where: { id: tiebreaker.id },
      include: { teams: true },
    });
  });

export const setTiebreakerWinner = (tournamentId: number, winnerId: number): Promise<Tiebreaker> =>
  prisma.tiebreaker.update({ where: { tournamentId }, data: { winnerId } });

export const setTiebreakerScore = (tiebreakerId: number, teamId: number, score: number): Promise<TiebreakerTeam> =>
  prisma.tiebreakerTeam.update({
    where: { tiebreakerId_teamId: { tiebreakerId, teamId } },
    data: { score },
  });

// ── Match generation helpers ───────────────────────────────────────────────────

export const findPoulesWithTeams = (tournamentId: number) =>
  prisma.poule.findMany({
    where: { tournamentId, phase: "GROUP_STAGE" },
    include: { teams: { include: { players: true }, orderBy: { id: "asc" } } },
    orderBy: { name: "asc" },
  });

export const deleteGroupMatchesByTournament = (tournamentId: number) =>
  prisma.match.deleteMany({ where: { tournamentId, phase: "GROUP_STAGE" } });

export const bulkCreateMatches = (matches: Array<{ tournamentId: number; pouleId: number | null; teamAId: number | null; teamBId: number | null; scheduledAt: Date; track: number | null; phase: Phase; bracketPos: string | null }>) =>
  prisma.match.createMany({ data: matches });

// ── Delay ────────────────────────────────────────────────────────────────────

export const shiftFutureMatchTimes = async (tournamentId: number, minutes: number): Promise<number> => {
  const result = await prisma.$executeRaw`
    UPDATE "Match"
    SET "scheduledAt" = "scheduledAt" + (${minutes} * INTERVAL '1 minute')
    WHERE "tournamentId" = ${tournamentId}
  `;
  return result;
};

// ── Standings ────────────────────────────────────────────────────────────────

export interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  saldo: number;
  points: number;
}

export type TeamStanding = Team & TeamStats;

export const findTeamsByPoule = async (pouleId: number): Promise<TeamStanding[]> => {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ where: { pouleId } }),
    prisma.match.findMany({ where: { pouleId, scoreA: { not: null }, scoreB: { not: null } } }),
  ]);

  const statsMap = new Map<number, TeamStats>(
    teams.map((t) => [t.id, { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, saldo: 0, points: 0 }])
  );

  for (const m of matches) {
    const { teamAId, teamBId, scoreA, scoreB } = m;
    if (scoreA === null || scoreB === null) continue;
    if (teamAId) applyMatchToStats(statsMap, teamAId, scoreA, scoreB);
    if (teamBId) applyMatchToStats(statsMap, teamBId, scoreB, scoreA);
  }

  const zero = (): TeamStats => ({ played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, saldo: 0, points: 0 });

  return teams
    .map((t) => ({ ...t, ...(statsMap.get(t.id) ?? zero()) }))
    .sort((a, b) =>
      b.points - a.points ||
      b.saldo - a.saldo ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
    );
};

function applyMatchToStats(map: Map<number, TeamStats>, teamId: number, myScore: number, oppScore: number) {
  const s = map.get(teamId);
  if (!s) return;
  s.played++;
  s.goalsFor += myScore;
  s.goalsAgainst += oppScore;
  s.saldo += myScore - oppScore;
  if (myScore > oppScore) { s.won++; s.points += 3; }
  else if (myScore === oppScore) { s.drawn++; s.points += 1; }
  else { s.lost++; }
}

export const deleteKnockoutMatches = (tournamentId: number) =>
  prisma.match.deleteMany({
    where: { tournamentId, phase: { not: "GROUP_STAGE" } },
  });
