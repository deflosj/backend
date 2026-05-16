import { Team } from "@prisma/client";
import {
  addTournament,
  setActiveTournament,
  saveTournamentRules,
  addPoule,
  removePoule,
  addTeam,
  recordScore,
  saveTiebreaker,
  recordTiebreakerScore,
  resolveTiebreakerWinner,
  generateGroupMatches,
  generateKnockout,
  applyDelay,
} from "../services/tournamentService";
import {
  findTournamentById,
  createTournament,
  activateTournament,
  upsertTournamentRules,
  findPouleById,
  findMatchById,
  scoreMatch,
  findTiebreakerByTournament,
  upsertTiebreaker,
  setTiebreakerScore,
  setTiebreakerWinner,
  findPoulesWithTeams,
  deleteGroupMatchesByTournament,
  bulkCreateMatches,
  findTeamsByPoule,
  deleteKnockoutMatches,
  shiftFutureMatchTimes,
} from "../repositories/tournamentRepository";

jest.mock("../repositories/tournamentRepository", () => ({
  __esModule: true,
  activateTournament: jest.fn(),
  bulkCreateMatches: jest.fn(),
  checkInTeam: jest.fn(),
  createMatch: jest.fn(),
  createPoule: jest.fn(),
  createTeam: jest.fn(),
  createTournament: jest.fn(),
  deleteGroupMatchesByTournament: jest.fn(),
  deleteKnockoutMatches: jest.fn(),
  deleteMatch: jest.fn(),
  deletePoule: jest.fn(),
  deleteTeam: jest.fn(),
  deleteTournament: jest.fn(),
  findActiveTournament: jest.fn(),
  findAllTournaments: jest.fn(),
  findMatchById: jest.fn(),
  findMatchesByTournament: jest.fn(),
  findPouleById: jest.fn(),
  findPoulesByTournament: jest.fn(),
  findPoulesWithTeams: jest.fn(),
  findTeamById: jest.fn(),
  findTeamsByPoule: jest.fn(),
  findTeamsByTournament: jest.fn(),
  findTiebreakerByTournament: jest.fn(),
  findTournamentById: jest.fn(),
  scoreMatch: jest.fn(),
  setTiebreakerScore: jest.fn(),
  setTiebreakerWinner: jest.fn(),
  shiftFutureMatchTimes: jest.fn(),
  updateMatch: jest.fn(),
  updatePoule: jest.fn(),
  updateTeam: jest.fn(),
  updateTournament: jest.fn(),
  upsertTiebreaker: jest.fn(),
  upsertTournamentRules: jest.fn(),
}));

const repo = {
  findTournamentById: findTournamentById as jest.Mock,
  createTournament: createTournament as jest.Mock,
  activateTournament: activateTournament as jest.Mock,
  upsertTournamentRules: upsertTournamentRules as jest.Mock,
  findPouleById: findPouleById as jest.Mock,
  findMatchById: findMatchById as jest.Mock,
  scoreMatch: scoreMatch as jest.Mock,
  findTiebreakerByTournament: findTiebreakerByTournament as jest.Mock,
  upsertTiebreaker: upsertTiebreaker as jest.Mock,
  setTiebreakerScore: setTiebreakerScore as jest.Mock,
  setTiebreakerWinner: setTiebreakerWinner as jest.Mock,
  findPoulesWithTeams: findPoulesWithTeams as jest.Mock,
  deleteGroupMatchesByTournament: deleteGroupMatchesByTournament as jest.Mock,
  bulkCreateMatches: bulkCreateMatches as jest.Mock,
  findTeamsByPoule: findTeamsByPoule as jest.Mock,
  deleteKnockoutMatches: deleteKnockoutMatches as jest.Mock,
  shiftFutureMatchTimes: shiftFutureMatchTimes as jest.Mock,
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeTournament = {
  id: 1,
  name: "Toernooi 2025",
  year: 2025,
  isActive: true,
  status: "UPCOMING",
  teamsPerPoule: 4,
  teamsAdvancingPerPoule: 2,
  bestNthsAdvancing: 0,
  createdAt: new Date("2025-01-01"),
  rules: null,
  poules: [],
  teams: [],
  matches: [],
};

const fakePoule = (id: number) => ({
  id,
  tournamentId: 1,
  name: `Poule ${id}`,
  description: null,
  phase: "GROUP" as const,
  teams: [],
});

const fakeMatch = {
  id: 1,
  tournamentId: 1,
  pouleId: 1,
  teamAId: 1,
  teamBId: 2,
  winnerId: null,
  time: new Date(),
  track: 1,
  phase: "GROUP" as const,
  bracketPos: null,
  scoreA: null,
  scoreB: null,
};

const fakeTiebreaker = { id: 1, tournamentId: 1, winnerId: null, teams: [] };

const makeTeam = (id: number, overrides: Partial<Team> = {}): Team => ({
  id,
  tournamentId: 1,
  captainId: null,
  pouleId: null,
  name: `Team ${id}`,
  logoUrl: null,
  isPresent: true,
  speler1: "p1",
  speler2: "p2",
  speler3: "p3",
  speler4: "p4",
  captainName: "Cap",
  played: 3,
  won: 1,
  drawn: 0,
  lost: 2,
  goalsFor: 3,
  goalsAgainst: 5,
  saldo: -2,
  points: 3,
  ...overrides,
});

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  repo.findTournamentById.mockResolvedValue(fakeTournament);
});

// ── addTournament ─────────────────────────────────────────────────────────────

describe("addTournament", () => {
  it("throws 400 when name is empty", async () => {
    await expect(async () => addTournament({ name: "", year: 2025 })).rejects.toMatchObject({
      statusCode: 400,
      message: "Name is required",
    });
    expect(repo.createTournament).not.toHaveBeenCalled();
  });

  it("throws 400 when name is only whitespace", async () => {
    await expect(async () => addTournament({ name: "   ", year: 2025 })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when year is below 2000", async () => {
    await expect(async () => addTournament({ name: "X", year: 1999 })).rejects.toMatchObject({
      statusCode: 400,
      message: "Valid year is required",
    });
  });

  it("trims the name before saving", async () => {
    repo.createTournament.mockResolvedValue({ ...fakeTournament, name: "Toernooi 2025" });
    await addTournament({ name: "  Toernooi 2025  ", year: 2025 });
    expect(repo.createTournament).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Toernooi 2025", year: 2025 })
    );
  });

  it("returns the created tournament", async () => {
    repo.createTournament.mockResolvedValue(fakeTournament);
    const result = await addTournament({ name: "Toernooi 2025", year: 2025 });
    expect(result.name).toBe("Toernooi 2025");
  });
});

// ── setActiveTournament ───────────────────────────────────────────────────────

describe("setActiveTournament", () => {
  it("throws 404 when tournament not found", async () => {
    repo.findTournamentById.mockResolvedValue(null);
    await expect(setActiveTournament(99)).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.activateTournament).not.toHaveBeenCalled();
  });

  it("calls activateTournament and returns tournament with ONGOING status", async () => {
    const activated = { ...fakeTournament, isActive: true, status: "ONGOING" };
    repo.activateTournament.mockResolvedValue(activated);
    const result = await setActiveTournament(1);
    expect(repo.activateTournament).toHaveBeenCalledWith(1);
    expect(result.status).toBe("ONGOING");
    expect(result.isActive).toBe(true);
  });
});

// ── saveTournamentRules ───────────────────────────────────────────────────────

describe("saveTournamentRules", () => {
  it("throws 404 when tournament not found", async () => {
    repo.findTournamentById.mockResolvedValue(null);
    await expect(saveTournamentRules(1, "Reglement")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when description is empty", async () => {
    await expect(saveTournamentRules(1, "")).rejects.toMatchObject({
      statusCode: 400,
      message: "Description is required",
    });
    expect(repo.upsertTournamentRules).not.toHaveBeenCalled();
  });

  it("throws 400 when description is only whitespace", async () => {
    await expect(saveTournamentRules(1, "   ")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("trims description before saving", async () => {
    const rules = { id: 1, tournamentId: 1, description: "Reglement", updatedAt: new Date() };
    repo.upsertTournamentRules.mockResolvedValue(rules);
    await saveTournamentRules(1, "  Reglement  ");
    expect(repo.upsertTournamentRules).toHaveBeenCalledWith(1, "Reglement");
  });
});

// ── addPoule ──────────────────────────────────────────────────────────────────

describe("addPoule", () => {
  it("throws 404 when tournament not found", async () => {
    repo.findTournamentById.mockResolvedValue(null);
    await expect(addPoule(1, { name: "Poule A" })).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when name is empty", async () => {
    await expect(addPoule(1, { name: "" })).rejects.toMatchObject({
      statusCode: 400,
      message: "Name is required",
    });
  });
});

// ── removePoule ───────────────────────────────────────────────────────────────

describe("removePoule", () => {
  it("throws 404 when poule not found", async () => {
    repo.findPouleById.mockResolvedValue(null);
    await expect(removePoule(99)).rejects.toMatchObject({
      statusCode: 404,
      message: "Poule not found",
    });
  });
});

// ── addTeam ───────────────────────────────────────────────────────────────────

describe("addTeam", () => {
  const validTeam = {
    name: "De Vlaamse Arend",
    captainName: "Luca Janssen",
    speler1: "Luca",
    speler2: "Tom",
    speler3: "Wout",
    speler4: "Jens",
  };

  it("throws 404 when tournament not found", async () => {
    repo.findTournamentById.mockResolvedValue(null);
    await expect(addTeam(1, validTeam)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when name is empty", async () => {
    await expect(addTeam(1, { ...validTeam, name: "" })).rejects.toMatchObject({
      statusCode: 400,
      message: "Name is required",
    });
  });

  it("throws 400 when captainName is empty", async () => {
    await expect(addTeam(1, { ...validTeam, captainName: "" })).rejects.toMatchObject({
      statusCode: 400,
      message: "Captain name is required",
    });
  });

  it("throws 400 when speler1 is empty", async () => {
    await expect(addTeam(1, { ...validTeam, speler1: "" })).rejects.toMatchObject({
      statusCode: 400,
      message: "All 4 player names are required",
    });
  });

  it("throws 400 when speler2 is empty", async () => {
    await expect(addTeam(1, { ...validTeam, speler2: "  " })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when speler3 is empty", async () => {
    await expect(addTeam(1, { ...validTeam, speler3: "" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when speler4 is empty", async () => {
    await expect(addTeam(1, { ...validTeam, speler4: "" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ── recordScore ───────────────────────────────────────────────────────────────

describe("recordScore", () => {
  beforeEach(() => {
    repo.findMatchById.mockResolvedValue(fakeMatch);
  });

  it("throws 400 when scoreA is negative", async () => {
    await expect(recordScore(1, -1, 0)).rejects.toMatchObject({
      statusCode: 400,
      message: "Scores must be non-negative",
    });
    expect(repo.scoreMatch).not.toHaveBeenCalled();
  });

  it("throws 400 when scoreB is negative", async () => {
    await expect(recordScore(1, 0, -1)).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.scoreMatch).not.toHaveBeenCalled();
  });

  it("accepts a 0-0 draw", async () => {
    const scored = { ...fakeMatch, scoreA: 0, scoreB: 0, winnerId: null };
    repo.scoreMatch.mockResolvedValue(scored);
    const result = await recordScore(1, 0, 0);
    expect(repo.scoreMatch).toHaveBeenCalledWith(1, 0, 0);
    expect(result.winnerId).toBeNull();
  });

  it("calls scoreMatch with the provided scores", async () => {
    repo.scoreMatch.mockResolvedValue({ ...fakeMatch, scoreA: 3, scoreB: 1, winnerId: 1 });
    await recordScore(1, 3, 1);
    expect(repo.scoreMatch).toHaveBeenCalledWith(1, 3, 1);
  });

  it("throws 404 when match not found", async () => {
    repo.findMatchById.mockResolvedValue(null);
    await expect(recordScore(99, 1, 0)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── saveTiebreaker ────────────────────────────────────────────────────────────

describe("saveTiebreaker", () => {
  it("throws 404 when tournament not found", async () => {
    repo.findTournamentById.mockResolvedValue(null);
    await expect(saveTiebreaker(1, [1, 2])).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when teamIds is empty", async () => {
    await expect(saveTiebreaker(1, [])).rejects.toMatchObject({
      statusCode: 400,
      message: "At least one team is required",
    });
    expect(repo.upsertTiebreaker).not.toHaveBeenCalled();
  });

  it("calls upsertTiebreaker with the provided teamIds", async () => {
    repo.upsertTiebreaker.mockResolvedValue({ ...fakeTiebreaker, teams: [] });
    await saveTiebreaker(1, [2, 3]);
    expect(repo.upsertTiebreaker).toHaveBeenCalledWith(1, [2, 3]);
  });
});

// ── recordTiebreakerScore ─────────────────────────────────────────────────────

describe("recordTiebreakerScore", () => {
  it("throws 404 when no tiebreaker exists", async () => {
    repo.findTiebreakerByTournament.mockResolvedValue(null);
    await expect(recordTiebreakerScore(1, 1, 5)).rejects.toMatchObject({
      statusCode: 404,
      message: "No tiebreaker for this tournament",
    });
  });

  it("throws 400 when score is negative", async () => {
    repo.findTiebreakerByTournament.mockResolvedValue(fakeTiebreaker);
    await expect(recordTiebreakerScore(1, 1, -1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Score must be non-negative",
    });
    expect(repo.setTiebreakerScore).not.toHaveBeenCalled();
  });

  it("accepts a score of 0", async () => {
    repo.findTiebreakerByTournament.mockResolvedValue(fakeTiebreaker);
    repo.setTiebreakerScore.mockResolvedValue({ id: 1, tiebreakId: 1, teamId: 1, score: 0 });
    await recordTiebreakerScore(1, 1, 0);
    expect(repo.setTiebreakerScore).toHaveBeenCalledWith(1, 1, 0);
  });

  it("calls setTiebreakerScore with tiebreaker id, teamId, and score", async () => {
    repo.findTiebreakerByTournament.mockResolvedValue(fakeTiebreaker);
    repo.setTiebreakerScore.mockResolvedValue({ id: 1, tiebreakId: 1, teamId: 2, score: 7 });
    await recordTiebreakerScore(1, 2, 7);
    expect(repo.setTiebreakerScore).toHaveBeenCalledWith(fakeTiebreaker.id, 2, 7);
  });
});

// ── resolveTiebreakerWinner ───────────────────────────────────────────────────

describe("resolveTiebreakerWinner", () => {
  it("throws 404 when no tiebreaker exists", async () => {
    repo.findTiebreakerByTournament.mockResolvedValue(null);
    await expect(resolveTiebreakerWinner(1, 2)).rejects.toMatchObject({
      statusCode: 404,
      message: "No tiebreaker for this tournament",
    });
    expect(repo.setTiebreakerWinner).not.toHaveBeenCalled();
  });

  it("calls setTiebreakerWinner and returns the updated tiebreaker", async () => {
    repo.findTiebreakerByTournament.mockResolvedValue(fakeTiebreaker);
    repo.setTiebreakerWinner.mockResolvedValue({ ...fakeTiebreaker, winnerId: 2 });
    const result = await resolveTiebreakerWinner(1, 2);
    expect(repo.setTiebreakerWinner).toHaveBeenCalledWith(1, 2);
    expect(result.winnerId).toBe(2);
  });
});

// ── applyDelay ────────────────────────────────────────────────────────────────

describe("applyDelay", () => {
  it("throws 400 when minutes is 0", async () => {
    await expect(applyDelay(1, 0)).rejects.toMatchObject({
      statusCode: 400,
      message: "minutes must be a non-zero integer",
    });
    expect(repo.shiftFutureMatchTimes).not.toHaveBeenCalled();
  });

  it("throws 400 when minutes is a non-integer (1.5)", async () => {
    await expect(applyDelay(1, 1.5)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("applies a positive delay", async () => {
    repo.shiftFutureMatchTimes.mockResolvedValue(6);
    const result = await applyDelay(1, 15);
    expect(repo.shiftFutureMatchTimes).toHaveBeenCalledWith(1, 15);
    expect(result).toEqual({ shiftedMinutes: 15, matchesAffected: 6 });
  });

  it("applies a negative delay (rewind)", async () => {
    repo.shiftFutureMatchTimes.mockResolvedValue(4);
    const result = await applyDelay(1, -10);
    expect(repo.shiftFutureMatchTimes).toHaveBeenCalledWith(1, -10);
    expect(result).toEqual({ shiftedMinutes: -10, matchesAffected: 4 });
  });
});

// ── generateGroupMatches ──────────────────────────────────────────────────────

describe("generateGroupMatches", () => {
  const startTime = new Date("2025-06-21T09:00:00");
  const slotMinutes = 25;

  const poulesWithTeams = (pouleId: number, teamCount: number) => ({
    ...fakePoule(pouleId),
    teams: Array.from({ length: teamCount }, (_, i) =>
      makeTeam(pouleId * 10 + i, { pouleId })
    ),
  });

  it("throws 400 when no group-phase poules exist", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([]);
    await expect(generateGroupMatches(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "No group-phase poules found",
    });
  });

  it("throws 400 when a poule has fewer than 2 teams", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([poulesWithTeams(1, 1)]);
    await expect(generateGroupMatches(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "Every poule must have at least 2 teams",
    });
  });

  it("generates 6 matches for a single poule of 4 teams (round-robin)", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([poulesWithTeams(1, 4)]);
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 6 });

    const result = await generateGroupMatches(1, { startTime, slotMinutes });
    expect(result.created).toBe(6);
    expect(repo.bulkCreateMatches).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ phase: "GROUP", tournamentId: 1 })])
    );
    const matches = repo.bulkCreateMatches.mock.calls[0][0] as unknown[];
    expect(matches).toHaveLength(6);
  });

  it("generates 3 rounds of 2 matches each for 4 teams", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([poulesWithTeams(1, 4)]);
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 6 });

    await generateGroupMatches(1, { startTime, slotMinutes });

    const matches = repo.bulkCreateMatches.mock.calls[0][0] as Array<{ time: Date }>;
    const uniqueTimes = new Set(matches.map((m) => m.time.getTime()));
    expect(uniqueTimes.size).toBe(3); // 3 distinct round times
  });

  it("generates 12 matches for 2 poules of 4 teams each", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([
      poulesWithTeams(1, 4),
      poulesWithTeams(2, 4),
    ]);
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 12 });

    const result = await generateGroupMatches(1, { startTime, slotMinutes });
    expect(result.created).toBe(12);
  });

  it("assigns tracks correctly across poules", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([
      poulesWithTeams(1, 4),
      poulesWithTeams(2, 4),
    ]);
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 12 });

    await generateGroupMatches(1, { startTime, slotMinutes, firstTrack: 1 });

    const matches = repo.bulkCreateMatches.mock.calls[0][0] as Array<{ track: number; pouleId: number }>;
    const poule1Tracks = new Set(matches.filter((m) => m.pouleId === 1).map((m) => m.track));
    const poule2Tracks = new Set(matches.filter((m) => m.pouleId === 2).map((m) => m.track));

    // Poule 1 should use tracks 1 and 2; poule 2 should use tracks 3 and 4
    expect(poule1Tracks).toEqual(new Set([1, 2]));
    expect(poule2Tracks).toEqual(new Set([3, 4]));
  });

  it("deletes existing group matches before generating new ones", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([poulesWithTeams(1, 4)]);
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 3 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 6 });

    await generateGroupMatches(1, { startTime, slotMinutes });
    expect(repo.deleteGroupMatchesByTournament).toHaveBeenCalledWith(1);

    const deletionOrder = repo.deleteGroupMatchesByTournament.mock.invocationCallOrder[0];
    const createOrder = repo.bulkCreateMatches.mock.invocationCallOrder[0];
    expect(deletionOrder).toBeLessThan(createOrder);
  });

  it("generates 3 matches for a single poule of 3 teams", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([poulesWithTeams(1, 3)]);
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 3 });

    const result = await generateGroupMatches(1, { startTime, slotMinutes });
    expect(result.created).toBe(3);
  });
});

// ── generateKnockout ──────────────────────────────────────────────────────────

describe("generateKnockout", () => {
  const startTime = new Date("2025-06-21T11:00:00");
  const slotMinutes = 60;

  const ranked = (pouleId: number, count: number): Team[] =>
    Array.from({ length: count }, (_, i) =>
      makeTeam(pouleId * 10 + i, { pouleId, points: (count - i) * 3 })
    );

  it("throws 400 when no group-phase poules exist", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([]);
    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "No group-phase poules found",
    });
  });

  it("throws 400 when fewer than 2 teams advance in total", async () => {
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 1, bestNthsAdvancing: 0 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1)]);
    repo.findTeamsByPoule.mockResolvedValue([makeTeam(1)]);

    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "Not enough advancing teams to generate knockout",
    });
  });

  it("throws 400 when more than 8 teams would advance", async () => {
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 4, bestNthsAdvancing: 0 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2), fakePoule(3)]);
    repo.findTeamsByPoule
      .mockResolvedValueOnce(ranked(1, 5))
      .mockResolvedValueOnce(ranked(2, 5))
      .mockResolvedValueOnce(ranked(3, 5));
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 0 });

    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("generates semi-final structure (SF1, SF2, CF1, F1) for 4 advancing teams", async () => {
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 2, bestNthsAdvancing: 0 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2)]);
    repo.findTeamsByPoule
      .mockResolvedValueOnce(ranked(1, 4)) // Poule A: top 2 advance
      .mockResolvedValueOnce(ranked(2, 4)); // Poule B: top 2 advance
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 4 });

    const result = await generateKnockout(1, { startTime, slotMinutes });
    expect(result.created).toBe(4);
    expect(result.totalAdvancing).toBe(4);

    expect(repo.bulkCreateMatches).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ phase: "SEMI", bracketPos: "SF1" }),
        expect.objectContaining({ phase: "SEMI", bracketPos: "SF2" }),
        expect.objectContaining({ phase: "CONSOLATION_FINAL", bracketPos: "CF1" }),
        expect.objectContaining({ phase: "FINAL", bracketPos: "F1" }),
      ])
    );
  });

  it("semi-finals cross-bracket: SF1 is poule-A-1st vs poule-B-2nd", async () => {
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 2, bestNthsAdvancing: 0 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2)]);

    const pouleATeams = ranked(1, 4); // ids: 10, 11, 12, 13
    const pouleBTeams = ranked(2, 4); // ids: 20, 21, 22, 23
    repo.findTeamsByPoule
      .mockResolvedValueOnce(pouleATeams)
      .mockResolvedValueOnce(pouleBTeams);
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 4 });

    await generateKnockout(1, { startTime, slotMinutes });

    const sf1 = (repo.bulkCreateMatches.mock.calls[0][0] as Array<{
      bracketPos: string;
      teamAId: number | null;
      teamBId: number | null;
    }>).find((m) => m.bracketPos === "SF1");

    expect(sf1).toBeDefined();
    expect(sf1?.teamAId).toBe(pouleATeams[0].id); // Poule A 1st
    expect(sf1?.teamBId).toBe(pouleBTeams[1].id); // Poule B 2nd
  });

  it("generates quarter-final structure for 8 advancing teams", async () => {
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 4, bestNthsAdvancing: 0 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2)]);
    repo.findTeamsByPoule
      .mockResolvedValueOnce(ranked(1, 4))
      .mockResolvedValueOnce(ranked(2, 4));
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 8 });

    const result = await generateKnockout(1, { startTime, slotMinutes });
    expect(result.created).toBe(8);
    expect(result.totalAdvancing).toBe(8);

    expect(repo.bulkCreateMatches).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ phase: "QUARTER", bracketPos: "QF1" }),
        expect.objectContaining({ phase: "QUARTER", bracketPos: "QF2" }),
        expect.objectContaining({ phase: "QUARTER", bracketPos: "QF3" }),
        expect.objectContaining({ phase: "QUARTER", bracketPos: "QF4" }),
        expect.objectContaining({ phase: "SEMI", bracketPos: "SF1" }),
        expect.objectContaining({ phase: "SEMI", bracketPos: "SF2" }),
        expect.objectContaining({ phase: "CONSOLATION_FINAL", bracketPos: "CF1" }),
        expect.objectContaining({ phase: "FINAL", bracketPos: "F1" }),
      ])
    );
  });

  it("includes best Nth-place finishers when bestNthsAdvancing > 0", async () => {
    // 2 poules × 1 advancing + 1 best 2nd = 3 total → semi-final structure
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 1, bestNthsAdvancing: 1 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2)]);
    repo.findTeamsByPoule
      .mockResolvedValueOnce(ranked(1, 3)) // Poule A: 3 teams; 1st advances, 2nd eligible for best-Nth
      .mockResolvedValueOnce(ranked(2, 3)); // Poule B: same
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 3 });

    const result = await generateKnockout(1, { startTime, slotMinutes });
    expect(result.totalAdvancing).toBe(3); // 2 firsts + 1 best second
  });

  it("deletes existing knockout matches before generating new ones", async () => {
    const tournament = { ...fakeTournament, teamsAdvancingPerPoule: 2, bestNthsAdvancing: 0 };
    repo.findTournamentById.mockResolvedValue(tournament);
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2)]);
    repo.findTeamsByPoule
      .mockResolvedValueOnce(ranked(1, 4))
      .mockResolvedValueOnce(ranked(2, 4));
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 4 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 4 });

    await generateKnockout(1, { startTime, slotMinutes });
    expect(repo.deleteKnockoutMatches).toHaveBeenCalledWith(1);

    const deletionOrder = repo.deleteKnockoutMatches.mock.invocationCallOrder[0];
    const createOrder = repo.bulkCreateMatches.mock.invocationCallOrder[0];
    expect(deletionOrder).toBeLessThan(createOrder);
  });
});
