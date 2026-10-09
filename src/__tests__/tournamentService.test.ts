import { Team, TournamentStatus } from "@prisma/client";
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
} from "../services/tournament.service";
import {
  findTournamentById,
  createTournament,
  activateTournament,
  updateTournamentRules,
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
  computeTeamStats,
  findMatchByBracketPos,
  createTeam,
  updateMatch,
  countUnscoredGroupMatches,
  TeamStanding,
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
  findTeamByToken: jest.fn(),
  findTeamsByPoule: jest.fn(),
  findTeamsByTournament: jest.fn(),
  findMatchByBracketPos: jest.fn(),
  generateTeamToken: jest.fn(() => "test-token"),
  // Echte Map terug, anders valt elke serialisatie stil
  computeTeamStats: jest.fn(() => new Map()),
  sortStandings: jest.fn((teams: unknown[]) => teams),
  findTiebreakerByTournament: jest.fn(),
  findTournamentById: jest.fn(),
  scoreMatch: jest.fn(),
  setTiebreakerScore: jest.fn(),
  setTiebreakerWinner: jest.fn(),
  shiftFutureMatchTimes: jest.fn(),
  updateMatch: jest.fn(),
  updatePoule: jest.fn(),
  updateTeam: jest.fn(),
  updateTeamLogo: jest.fn(),
  updateTournament: jest.fn(),
  upsertTiebreaker: jest.fn(),
  updateTournamentRules: jest.fn(),
  countUnscoredGroupMatches: jest.fn(),
}));

const repo = {
  findMatchByBracketPos: findMatchByBracketPos as jest.Mock,
  computeTeamStats: computeTeamStats as jest.Mock,
  findTournamentById: findTournamentById as jest.Mock,
  createTournament: createTournament as jest.Mock,
  activateTournament: activateTournament as jest.Mock,
  updateTournamentRules: updateTournamentRules as jest.Mock,
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
  createTeam: createTeam as jest.Mock,
  updateMatch: updateMatch as jest.Mock,
  countUnscoredGroupMatches: countUnscoredGroupMatches as jest.Mock,
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeTournament = {
  id: 1,
  name: "Toernooi 2025",
  year: 2025,
  isActive: true,
  status: TournamentStatus.UPCOMING,
  teamsPerPoule: 4,
  teamsAdvancingPerPoule: 2,
  bestNthsAdvancing: 0,
  trackCount: 6,
  createdAt: new Date("2025-01-01"),
  rules: null,
  rulesUpdatedAt: null,
  teamEditDeadline: null,
  updatedAt: new Date("2025-01-01"),
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
  captainName: "Luca",
  email: null,
  pouleId: null,
  name: `Team ${id}`,
  logoUrl: null,
  isPresent: true,
  isPaid: false,
  paymentMethod: null,
  phone: null,
  speler1: "Luca",
  speler2: "Tom",
  speler3: "Wout",
  speler4: "Jens",
  token: `token-${id}`,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  ...overrides,
});

const makeStanding = (id: number, overrides: Partial<TeamStanding> = {}): TeamStanding => ({
  ...makeTeam(id, overrides),
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
    const activated = { ...fakeTournament, isActive: true, status: TournamentStatus.ONGOING };
    repo.activateTournament.mockResolvedValue(activated);
    const result = await setActiveTournament(1);
    expect(repo.activateTournament).toHaveBeenCalledWith(1);
    expect(result.status).toBe(TournamentStatus.ONGOING);
    expect(result.isActive).toBe(true);
  });
});

// ── saveTournamentRules ───────────────────────────────────────────────────────

describe("saveTournamentRules", () => {
  it("throws 404 when tournament not found", async () => {
    repo.findTournamentById.mockResolvedValue(null);
    await expect(saveTournamentRules(1, "Reglement")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when rules is empty", async () => {
    await expect(saveTournamentRules(1, "")).rejects.toMatchObject({
      statusCode: 400,
      message: "Rules are required",
    });
    expect(repo.updateTournamentRules).not.toHaveBeenCalled();
  });

  it("throws 400 when rules is only whitespace", async () => {
    await expect(saveTournamentRules(1, "   ")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("trims rules before saving", async () => {
    repo.updateTournamentRules.mockResolvedValue({ ...fakeTournament, rules: "Reglement", rulesUpdatedAt: new Date() });
    await saveTournamentRules(1, "  Reglement  ");
    expect(repo.updateTournamentRules).toHaveBeenCalledWith(1, "Reglement");
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
    captainName: "Luca",
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

  it("throws 400 when the name is whitespace only", async () => {
    await expect(addTeam(1, { ...validTeam, name: "   " })).rejects.toMatchObject({
      statusCode: 400,
      message: "Name is required",
    });
  });

  it("accepts a team without player names — die vult de ploeg zelf aan", async () => {
    repo.createTeam.mockResolvedValue(makeTeam(7, { name: "De Vlaamse Arend" }));
    const team = await addTeam(1, { name: "De Vlaamse Arend" });
    expect(team.name).toBe("De Vlaamse Arend");
    expect(repo.createTeam).toHaveBeenCalledWith(1, { name: "De Vlaamse Arend" });
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
  const startTime = new Date("2025-10-31T17:00:00");
  const slotMinutes = 20;

  const pouleWithTeams = (pouleId: number, teamCount: number) => ({
    ...fakePoule(pouleId),
    teams: Array.from({ length: teamCount }, (_, i) => makeTeam(pouleId * 10 + i, { pouleId })),
  });

  type Planned = { track: number; pouleId: number; scheduledAt: Date; teamAId: number; teamBId: number; tournamentId: number };
  const created = () => repo.bulkCreateMatches.mock.calls[0][0] as Planned[];

  beforeEach(() => {
    repo.deleteGroupMatchesByTournament.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 0 });
  });

  it("throws 400 when no group-phase poules exist", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([]);
    await expect(generateGroupMatches(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "No group-phase poules found",
    });
  });

  it("throws 400 when a poule has fewer than 2 teams", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([pouleWithTeams(1, 1)]);
    await expect(generateGroupMatches(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "Every poule must have at least 2 teams",
    });
  });

  it("48 teams in 12 poules on 6 tracks: like 2025 (2 poules per track, 17:00–20:40)", async () => {
    repo.findPoulesWithTeams.mockResolvedValue(Array.from({ length: 12 }, (_, i) => pouleWithTeams(i + 1, 4)));

    const result = await generateGroupMatches(1, { startTime, slotMinutes });
    const ms = created();

    expect(result.created).toBe(72);
    expect(result.tracksUsed).toBe(6);
    expect(new Set(ms.map((m) => m.track))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    // Baan 1 = poule 1 en 2, baan 6 = poule 11 en 12
    expect(new Set(ms.filter((m) => m.track === 1).map((m) => m.pouleId))).toEqual(new Set([1, 2]));
    expect(new Set(ms.filter((m) => m.track === 6).map((m) => m.pouleId))).toEqual(new Set([11, 12]));
    // Nooit meer dan 6 wedstrijden tegelijk, nooit 2 op dezelfde baan tegelijk
    const bySlot = new Map<number, Planned[]>();
    for (const m of ms) bySlot.set(m.scheduledAt.getTime(), [...(bySlot.get(m.scheduledAt.getTime()) ?? []), m]);
    expect(bySlot.size).toBe(12);
    for (const slot of bySlot.values()) {
      expect(slot.length).toBe(6);
      expect(new Set(slot.map((m) => m.track)).size).toBe(6);
    }
    expect(result.lastSlotAt).toEqual(new Date("2025-10-31T20:40:00"));
    // Poules wisselen af: poule 1 om 17:00, poule 2 om 17:20
    const track1 = ms.filter((m) => m.track === 1);
    expect(track1[0].pouleId).toBe(1);
    expect(track1[1].pouleId).toBe(2);
  });

  it("no team plays twice in the same slot", async () => {
    repo.findPoulesWithTeams.mockResolvedValue(Array.from({ length: 12 }, (_, i) => pouleWithTeams(i + 1, 4)));
    await generateGroupMatches(1, { startTime, slotMinutes });
    const seen = new Set<string>();
    for (const m of created()) {
      for (const t of [m.teamAId, m.teamBId]) {
        const key = `${m.scheduledAt.getTime()}-${t}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("uses the trackCount override", async () => {
    repo.findPoulesWithTeams.mockResolvedValue(Array.from({ length: 12 }, (_, i) => pouleWithTeams(i + 1, 4)));
    const result = await generateGroupMatches(1, { startTime, slotMinutes, trackCount: 4 });
    expect(result.tracksUsed).toBe(4);
    expect(Math.max(...created().map((m) => m.track))).toBe(4);
  });

  it("a poule with spare tracks plays a round in parallel", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([pouleWithTeams(1, 4), pouleWithTeams(2, 4)]);
    await generateGroupMatches(1, { startTime, slotMinutes });
    const ms = created();
    expect(ms).toHaveLength(12);
    expect(new Set(ms.filter((m) => m.pouleId === 1).map((m) => m.track))).toEqual(new Set([1, 2]));
    expect(new Set(ms.filter((m) => m.pouleId === 2).map((m) => m.track))).toEqual(new Set([4, 5]));
    expect(new Set(ms.map((m) => m.scheduledAt.getTime())).size).toBe(3);
  });

  it("generates 3 matches for a single poule of 3 teams", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([pouleWithTeams(1, 3)]);
    const result = await generateGroupMatches(1, { startTime, slotMinutes });
    expect(result.created).toBe(3);
  });

  it("deletes existing group matches before generating new ones", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([pouleWithTeams(1, 4)]);
    await generateGroupMatches(1, { startTime, slotMinutes });
    expect(repo.deleteGroupMatchesByTournament).toHaveBeenCalledWith(1);
    expect(repo.deleteGroupMatchesByTournament.mock.invocationCallOrder[0]).toBeLessThan(
      repo.bulkCreateMatches.mock.invocationCallOrder[0]
    );
  });
});

// ── generateKnockout ──────────────────────────────────────────────────────────

describe("generateKnockout", () => {
  const startTime = new Date("2025-10-31T21:20:00");
  const slotMinutes = 20;

  type Planned = { bracketPos: string; phase: string; teamAId: number | null; teamBId: number | null; track: number; scheduledAt: Date };
  const created = () => repo.bulkCreateMatches.mock.calls[0][0] as Planned[];

  /** Poule p: team p*10+i op plaats i, sterkere poules hebben meer saldo. */
  const ranked = (pouleId: number, count: number): TeamStanding[] =>
    Array.from({ length: count }, (_, i) =>
      makeStanding(pouleId * 10 + i, { pouleId, points: (count - i) * 2, saldo: 20 - i * 5 + pouleId, goalsFor: 10 })
    );

  const twelvePoules = () => {
    repo.findTournamentById.mockResolvedValue({ ...fakeTournament, teamsAdvancingPerPoule: 2, bestNthsAdvancing: 8, trackCount: 6 });
    repo.findPoulesWithTeams.mockResolvedValue(Array.from({ length: 12 }, (_, i) => fakePoule(i + 1)));
    for (let p = 1; p <= 12; p++) repo.findTeamsByPoule.mockResolvedValueOnce(ranked(p, 4));
  };

  beforeEach(() => {
    repo.countUnscoredGroupMatches.mockResolvedValue(0);
    repo.deleteKnockoutMatches.mockResolvedValue({ count: 0 });
    repo.bulkCreateMatches.mockResolvedValue({ count: 0 });
  });

  it("throws 400 when no group-phase poules exist", async () => {
    repo.findPoulesWithTeams.mockResolvedValue([]);
    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "No group-phase poules found",
    });
  });

  it("refuses while group matches are unscored, unless forced", async () => {
    twelvePoules();
    repo.countUnscoredGroupMatches.mockResolvedValue(3);
    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.bulkCreateMatches).not.toHaveBeenCalled();

    twelvePoules();
    await generateKnockout(1, { startTime, slotMinutes, force: true });
    expect(repo.bulkCreateMatches).toHaveBeenCalled();
  });

  it("throws 400 when fewer than 2 teams advance in total", async () => {
    repo.findTournamentById.mockResolvedValue({ ...fakeTournament, teamsAdvancingPerPoule: 1, bestNthsAdvancing: 0 });
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1)]);
    repo.findTeamsByPoule.mockResolvedValue([makeStanding(1)]);
    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({
      statusCode: 400,
      message: "Not enough advancing teams to generate knockout",
    });
  });

  it("throws 400 when more than 32 teams would advance", async () => {
    repo.findTournamentById.mockResolvedValue({ ...fakeTournament, teamsAdvancingPerPoule: 3, bestNthsAdvancing: 0 });
    repo.findPoulesWithTeams.mockResolvedValue(Array.from({ length: 12 }, (_, i) => fakePoule(i + 1)));
    for (let p = 1; p <= 12; p++) repo.findTeamsByPoule.mockResolvedValueOnce(ranked(p, 4));
    await expect(generateKnockout(1, { startTime, slotMinutes })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("48 teams → 32: full bracket R32 → F1 + CF1", async () => {
    twelvePoules();
    const result = await generateKnockout(1, { startTime, slotMinutes });
    const ms = created();

    expect(result.totalAdvancing).toBe(32);
    expect(ms.filter((m) => m.phase === "ROUND_OF_32")).toHaveLength(16);
    expect(ms.filter((m) => m.phase === "ROUND_OF_16")).toHaveLength(8);
    expect(ms.filter((m) => m.phase === "QUARTER_FINAL")).toHaveLength(4);
    expect(ms.filter((m) => m.phase === "SEMI_FINAL")).toHaveLength(2);
    expect(ms.map((m) => m.bracketPos)).toEqual(expect.arrayContaining(["R32-1", "R32-16", "R16-8", "QF4", "SF2", "F1", "CF1"]));
    // Enkel de eerste ronde is ingevuld
    expect(ms.filter((m) => m.phase === "ROUND_OF_32").every((m) => m.teamAId && m.teamBId)).toBe(true);
    expect(ms.filter((m) => m.phase !== "ROUND_OF_32").every((m) => !m.teamAId && !m.teamBId)).toBe(true);
  });

  it("seeds: all 1sts, all 2nds, 8 best 3rds; no same-poule match in R32", async () => {
    twelvePoules();
    const result = await generateKnockout(1, { startTime, slotMinutes });
    const seeds = result.seeds;
    // 12 eersten (id eindigt op 0), 12 tweedes (1), 8 derdes (2)
    expect(seeds.slice(0, 12).every((s) => s.teamId % 10 === 0)).toBe(true);
    expect(seeds.slice(12, 24).every((s) => s.teamId % 10 === 1)).toBe(true);
    expect(seeds.slice(24).every((s) => s.teamId % 10 === 2)).toBe(true);
    // Sterkste derdes: hoogste saldo = hoogste poulenummer
    expect(seeds.slice(24).map((s) => s.pouleId).sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);

    for (const m of created().filter((x) => x.phase === "ROUND_OF_32")) {
      expect(Math.floor((m.teamAId as number) / 10)).not.toBe(Math.floor((m.teamBId as number) / 10));
    }
    // Seed 1 (R32-1) speelt tegen een derde
    const r1 = created().find((m) => m.bracketPos === "R32-1")!;
    expect(r1.teamAId).toBe(seeds[0].teamId);
    expect((r1.teamBId as number) % 10).toBe(2);
  });

  it("schedules each round after the previous one on max trackCount tracks", async () => {
    twelvePoules();
    await generateKnockout(1, { startTime, slotMinutes, breakMinutes: 10 });
    const ms = created();
    const times = (phase: string) => [...new Set(ms.filter((m) => m.phase === phase).map((m) => m.scheduledAt.toISOString()))];
    expect(Math.max(...ms.map((m) => m.track))).toBe(6);
    // 16 wedstrijden / 6 banen = 3 slots: 21:20, 21:40, 22:00
    expect(times("ROUND_OF_32")).toHaveLength(3);
    // R16 start na 3 slots + 10 min pauze = 22:30
    expect(times("ROUND_OF_16")[0]).toBe(new Date("2025-10-31T22:30:00").toISOString());
    // Finale en kleine finale tegelijk, op verschillende banen
    const f = ms.find((m) => m.bracketPos === "F1")!;
    const cf = ms.find((m) => m.bracketPos === "CF1")!;
    expect(f.scheduledAt).toEqual(cf.scheduledAt);
    expect(f.track).not.toBe(cf.track);
  });

  it("byes: 6 teams → top 2 seeds go straight to the semi-finals", async () => {
    repo.findTournamentById.mockResolvedValue({ ...fakeTournament, teamsAdvancingPerPoule: 2, bestNthsAdvancing: 0 });
    repo.findPoulesWithTeams.mockResolvedValue([fakePoule(1), fakePoule(2), fakePoule(3)]);
    for (let p = 1; p <= 3; p++) repo.findTeamsByPoule.mockResolvedValueOnce(ranked(p, 4));
    const result = await generateKnockout(1, { startTime, slotMinutes });
    const ms = created();
    expect(ms.filter((m) => m.phase === "QUARTER_FINAL")).toHaveLength(2);
    const placed = ms.filter((m) => m.phase === "SEMI_FINAL").flatMap((m) => [m.teamAId, m.teamBId]).filter(Boolean);
    expect(placed.sort()).toEqual([result.seeds[0].teamId, result.seeds[1].teamId].sort());
  });

  it("deletes existing knockout matches before generating new ones", async () => {
    twelvePoules();
    await generateKnockout(1, { startTime, slotMinutes });
    expect(repo.deleteKnockoutMatches).toHaveBeenCalledWith(1);
    expect(repo.deleteKnockoutMatches.mock.invocationCallOrder[0]).toBeLessThan(
      repo.bulkCreateMatches.mock.invocationCallOrder[0]
    );
  });
});

// ── Bracket doorschuiven ──────────────────────────────────────────────────────

describe("recordScore in the knockout", () => {
  it("moves the winner of R32-3 to R16-2 slot A", async () => {
    const m = { ...fakeMatch, id: 5, phase: "ROUND_OF_32", bracketPos: "R32-3", teamAId: 7, teamBId: 8 };
    repo.findMatchById.mockResolvedValue(m);
    repo.scoreMatch.mockResolvedValue({ ...m, scoreA: 13, scoreB: 4, winnerId: 7 });
    repo.findMatchByBracketPos.mockResolvedValue({ id: 99 });
    await recordScore(5, 13, 4);
    expect(repo.findMatchByBracketPos).toHaveBeenCalledWith(1, "R16-2");
    expect(repo.updateMatch).toHaveBeenCalledWith(99, { teamAId: 7 });
  });

  it("semi-final loser goes to the consolation final", async () => {
    const m = { ...fakeMatch, id: 6, phase: "SEMI_FINAL", bracketPos: "SF2", teamAId: 7, teamBId: 8 };
    repo.findMatchById.mockResolvedValue(m);
    repo.scoreMatch.mockResolvedValue({ ...m, scoreA: 2, scoreB: 13, winnerId: 8 });
    repo.findMatchByBracketPos.mockResolvedValueOnce({ id: 100 }).mockResolvedValueOnce({ id: 101 });
    await recordScore(6, 2, 13);
    expect(repo.findMatchByBracketPos).toHaveBeenNthCalledWith(1, 1, "F1");
    expect(repo.updateMatch).toHaveBeenCalledWith(100, { teamBId: 8 });
    expect(repo.findMatchByBracketPos).toHaveBeenNthCalledWith(2, 1, "CF1");
    expect(repo.updateMatch).toHaveBeenCalledWith(101, { teamBId: 7 });
  });

  it("rejects a draw in a knockout match", async () => {
    repo.findMatchById.mockResolvedValue({ ...fakeMatch, bracketPos: "QF1" });
    await expect(recordScore(1, 5, 5)).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.scoreMatch).not.toHaveBeenCalled();
  });
});
