import { Match, Phase, Poule, Team, Tiebreaker, TiebreakTeam, Tournament, TournamentRules } from "@prisma/client";
import prisma from "../database/prisma";

// ── Tournament ────────────────────────────────────────────────────────────────

export interface TournamentData {
  name: string;
  year: number;
}

export const findAllTournaments = (): Promise<Tournament[]> =>
  prisma.tournament.findMany({ orderBy: { year: "desc" } });

export const findTournamentById = (id: number): Promise<(Tournament & { rules: TournamentRules | null; poules: Poule[]; teams: Team[]; matches: Match[] }) | null> =>
  prisma.tournament.findUnique({
    where: { id },
    include: { rules: true, poules: true, teams: true, matches: true },
  });

export const findActiveTournament = (): Promise<(Tournament & { rules: TournamentRules | null; poules: Poule[]; teams: Team[]; matches: Match[] }) | null> =>
  prisma.tournament.findFirst({
    where: { isActive: true },
    include: { rules: true, poules: true, teams: true, matches: true },
  });

export const createTournament = (data: TournamentData): Promise<Tournament> =>
  prisma.tournament.create({ data });

export const updateTournament = (id: number, data: Partial<TournamentData>): Promise<Tournament> =>
  prisma.tournament.update({ where: { id }, data });

export const deleteTournament = (id: number): Promise<Tournament> =>
  prisma.tournament.delete({ where: { id } });

export const activateTournament = (id: number): Promise<Tournament> =>
  prisma.$transaction(async (tx) => {
    await tx.tournament.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.tournament.update({ where: { id }, data: { isActive: true } });
  });

// ── Rules ─────────────────────────────────────────────────────────────────────

export const upsertTournamentRules = (tournamentId: number, description: string): Promise<TournamentRules> =>
  prisma.tournamentRules.upsert({
    where: { tournamentId },
    create: { tournamentId, description },
    update: { description },
  });

// ── Poules ────────────────────────────────────────────────────────────────────

export interface PouleData {
  name: string;
  description?: string | null;
  phase?: Phase;
}

export const findPoulesByTournament = (tournamentId: number): Promise<(Poule & { teams: Team[] })[]> =>
  prisma.poule.findMany({
    where: { tournamentId },
    include: { teams: true },
    orderBy: { name: "asc" },
  });

export const findPouleById = (id: number): Promise<(Poule & { teams: Team[] }) | null> =>
  prisma.poule.findUnique({ where: { id }, include: { teams: true } });

export const createPoule = (tournamentId: number, data: PouleData): Promise<Poule> =>
  prisma.poule.create({ data: { tournamentId, ...data } });

export const updatePoule = (id: number, data: Partial<PouleData>): Promise<Poule> =>
  prisma.poule.update({ where: { id }, data });

export const deletePoule = (id: number): Promise<Poule> =>
  prisma.poule.delete({ where: { id } });

// ── Teams ─────────────────────────────────────────────────────────────────────

export interface TeamData {
  name: string;
  logoUrl?: string | null;
  pouleId?: number | null;
  captainId?: number | null;
  captainName: string;
  speler1: string;
  speler2: string;
  speler3: string;
  speler4: string;
}

export const findTeamsByTournament = (tournamentId: number): Promise<Team[]> =>
  prisma.team.findMany({ where: { tournamentId }, orderBy: { name: "asc" } });

export const findTeamById = (id: number): Promise<Team | null> =>
  prisma.team.findUnique({ where: { id } });

export const createTeam = (tournamentId: number, data: TeamData): Promise<Team> =>
  prisma.team.create({ data: { tournamentId, ...data } });

export const updateTeam = (id: number, data: Partial<TeamData>): Promise<Team> =>
  prisma.team.update({ where: { id }, data });

export const deleteTeam = (id: number): Promise<Team> =>
  prisma.team.delete({ where: { id } });

export const checkInTeam = (id: number, isPresent: boolean): Promise<Team> =>
  prisma.team.update({ where: { id }, data: { isPresent } });

// ── Matches ───────────────────────────────────────────────────────────────────

export interface MatchData {
  pouleId?: number | null;
  teamAId?: number | null;
  teamBId?: number | null;
  time?: Date;
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
    orderBy: [{ phase: "asc" }, { time: "asc" }],
  });

export const findMatchById = (id: number): Promise<Match | null> =>
  prisma.match.findUnique({ where: { id } });

export const createMatch = (tournamentId: number, data: MatchData): Promise<Match> =>
  prisma.match.create({ data: { tournamentId, ...data } });

export const updateMatch = (id: number, data: Partial<MatchData>): Promise<Match> =>
  prisma.match.update({ where: { id }, data });

export const deleteMatch = (id: number): Promise<Match> =>
  prisma.match.delete({ where: { id } });

export const scoreMatch = (matchId: number, scoreA: number, scoreB: number): Promise<Match> =>
  prisma.$transaction(async (tx) => {
    const match = await tx.match.findUniqueOrThrow({ where: { id: matchId } });

    // Undo previous stats if match was already scored
    if (match.scoreA !== null && match.scoreB !== null) {
      const oldScoreA = match.scoreA;
      const oldScoreB = match.scoreB;

      if (match.teamAId) {
        const undo = buildStatsUndo(oldScoreA, oldScoreB);
        await tx.team.update({ where: { id: match.teamAId }, data: undo });
      }
      if (match.teamBId) {
        const undo = buildStatsUndo(oldScoreB, oldScoreA);
        await tx.team.update({ where: { id: match.teamBId }, data: undo });
      }
    }

    // Determine winner
    let winnerId: number | null = null;
    if (scoreA > scoreB) winnerId = match.teamAId ?? null;
    else if (scoreB > scoreA) winnerId = match.teamBId ?? null;

    // Apply new stats
    if (match.teamAId) {
      await tx.team.update({
        where: { id: match.teamAId },
        data: buildStatsApply(scoreA, scoreB),
      });
    }
    if (match.teamBId) {
      await tx.team.update({
        where: { id: match.teamBId },
        data: buildStatsApply(scoreB, scoreA),
      });
    }

    return tx.match.update({
      where: { id: matchId },
      data: { scoreA, scoreB, winnerId },
    });
  });

function pointsFor(isWin: boolean, isDraw: boolean): number {
  if (isWin) return 3;
  if (isDraw) return 1;
  return 0;
}

function buildStatsUndo(myScore: number, oppScore: number) {
  const isWin = myScore > oppScore;
  const isDraw = myScore === oppScore;
  const isLoss = !isWin && !isDraw;

  return {
    played: { decrement: 1 },
    goalsFor: { decrement: myScore },
    goalsAgainst: { decrement: oppScore },
    saldo: { decrement: myScore - oppScore },
    won: isWin ? { decrement: 1 } : { increment: 0 },
    drawn: isDraw ? { decrement: 1 } : { increment: 0 },
    lost: isLoss ? { decrement: 1 } : { increment: 0 },
    points: { decrement: pointsFor(isWin, isDraw) },
  };
}

function buildStatsApply(myScore: number, oppScore: number) {
  const isWin = myScore > oppScore;
  const isDraw = myScore === oppScore;
  const isLoss = !isWin && !isDraw;

  return {
    played: { increment: 1 },
    goalsFor: { increment: myScore },
    goalsAgainst: { increment: oppScore },
    saldo: { increment: myScore - oppScore },
    won: isWin ? { increment: 1 } : { decrement: 0 },
    drawn: isDraw ? { increment: 1 } : { decrement: 0 },
    lost: isLoss ? { increment: 1 } : { decrement: 0 },
    points: { increment: pointsFor(isWin, isDraw) },
  };
}

// ── Tiebreaker ────────────────────────────────────────────────────────────────

export const findTiebreakerByTournament = (tournamentId: number): Promise<(Tiebreaker & { teams: TiebreakTeam[] }) | null> =>
  prisma.tiebreaker.findUnique({
    where: { tournamentId },
    include: { teams: true },
  });

export const upsertTiebreaker = async (tournamentId: number, teamIds: number[]): Promise<Tiebreaker & { teams: TiebreakTeam[] }> =>
  prisma.$transaction(async (tx) => {
    const tiebreaker = await tx.tiebreaker.upsert({
      where: { tournamentId },
      create: { tournamentId },
      update: {},
    });

    // Replace team entries
    await tx.tiebreakTeam.deleteMany({ where: { tiebreakId: tiebreaker.id } });
    await tx.tiebreakTeam.createMany({
      data: teamIds.map((teamId) => ({ tiebreakId: tiebreaker.id, teamId })),
    });

    return tx.tiebreaker.findUniqueOrThrow({
      where: { id: tiebreaker.id },
      include: { teams: true },
    });
  });

export const setTiebreakerWinner = (tournamentId: number, winnerId: number): Promise<Tiebreaker> =>
  prisma.tiebreaker.update({ where: { tournamentId }, data: { winnerId } });

export const setTiebreakerScore = (tiebreakId: number, teamId: number, score: number): Promise<TiebreakTeam> =>
  prisma.tiebreakTeam.update({
    where: { tiebreakId_teamId: { tiebreakId, teamId } },
    data: { score },
  });
