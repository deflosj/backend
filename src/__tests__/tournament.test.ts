import request from "supertest";
import jwt from "jsonwebtoken";
import { TournamentStatus } from "@prisma/client";
import { createApp } from "../app";
import config from "../config";
import { HttpError } from "../utils/httpError";
import * as tournamentService from "../services/tournament.service";

jest.mock("../services/tournament.service");

const svc = tournamentService as jest.Mocked<typeof tournamentService>;
const app = createApp();

const adminToken = jwt.sign(
  { email: "admin@example.com", username: "admin", role: "ADMIN" },
  config.jwtSecret,
  { subject: "1" }
);
const memberToken = jwt.sign(
  { email: "member@example.com", username: "member", role: "MEMBER" },
  config.jwtSecret,
  { subject: "2" }
);

// ── Shared fixtures ──────────────────────────────────────────────────────────

const T = {
  id: 1,
  name: "Toernooi 2025",
  year: 2025,
  isActive: true,
  status: TournamentStatus.ONGOING,
  teamsPerPoule: 4,
  teamsAdvancingPerPoule: 2,
  bestNthsAdvancing: 0,
  createdAt: new Date("2025-01-01"),
  rules: null,
  rulesUpdatedAt: null,
  poules: [],
  teams: [],
  matches: [],
};

const RULES_TOURNAMENT = {
  ...T,
  rules: "Reglement",
  rulesUpdatedAt: new Date("2025-01-01"),
};

const POULE = {
  id: 1,
  tournamentId: 1,
  name: "Poule A",
  description: null,
  phase: "GROUP_STAGE" as const,
  teams: [],
};

const TEAM = {
  id: 1,
  tournamentId: 1,
  captainId: null,
  pouleId: 1,
  name: "De Vlaamse Arend",
  logoUrl: null,
  isPresent: false,
  players: [
    { id: 1, teamId: 1, name: "Luca", isCaptain: true },
    { id: 2, teamId: 1, name: "Tom", isCaptain: false },
    { id: 3, teamId: 1, name: "Wout", isCaptain: false },
    { id: 4, teamId: 1, name: "Jens", isCaptain: false },
  ],
};

const MATCH = {
  id: 1,
  tournamentId: 1,
  pouleId: 1,
  teamAId: 1,
  teamBId: 2,
  winnerId: null,
  scheduledAt: new Date("2025-06-21T09:00:00"),
  track: 1,
  phase: "GROUP_STAGE" as const,
  bracketPos: null,
  scoreA: null,
  scoreB: null,
};

const TIEBREAKER = {
  id: 1,
  tournamentId: 1,
  winnerId: null,
  teams: [],
};

const TIEBREAK_TEAM = { id: 1, tiebreakId: 1, teamId: 1, score: null };

describe("Tournament Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Tournaments ──────────────────────────────────────────────────────────────

  describe("Tournaments", () => {
    it("GET / returns a list of tournaments", async () => {
      svc.listTournaments.mockResolvedValue([T]);
      const res = await request(app).get("/tournaments");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Toernooi 2025");
    });

    it("GET /active returns the active tournament", async () => {
      svc.getActiveTournament.mockResolvedValue(T);
      const res = await request(app).get("/tournaments/active");
      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(true);
      expect(res.body.status).toBe("ONGOING");
    });

    it("GET /active returns 404 when no tournament is active", async () => {
      svc.getActiveTournament.mockRejectedValue(new HttpError(404, "No active tournament"));
      const res = await request(app).get("/tournaments/active");
      expect(res.status).toBe(404);
    });

    it("GET /:id returns a tournament by id", async () => {
      svc.getTournament.mockResolvedValue(T);
      const res = await request(app).get("/tournaments/1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it("GET /:id returns 404 when not found", async () => {
      svc.getTournament.mockRejectedValue(new HttpError(404, "Tournament not found"));
      const res = await request(app).get("/tournaments/99");
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Tournament not found");
    });

    it("POST / creates a tournament as admin and returns 201", async () => {
      svc.addTournament.mockResolvedValue(T);
      const res = await request(app)
        .post("/tournaments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Toernooi 2025", year: 2025 });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Toernooi 2025");
    });

    it("POST / returns 400 when service rejects (validation)", async () => {
      svc.addTournament.mockRejectedValue(new HttpError(400, "Name is required"));
      const res = await request(app)
        .post("/tournaments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "", year: 2025 });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Name is required");
    });

    it("POST / returns 401 without an auth token", async () => {
      const res = await request(app)
        .post("/tournaments")
        .send({ name: "X", year: 2025 });
      expect(res.status).toBe(401);
    });

    it("POST / returns 403 for a non-admin role", async () => {
      const res = await request(app)
        .post("/tournaments")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ name: "X", year: 2025 });
      expect(res.status).toBe(403);
    });

    it("PUT /:id updates a tournament as admin", async () => {
      svc.editTournament.mockResolvedValue({ ...T, name: "Updated" });
      const res = await request(app)
        .put("/tournaments/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated", year: 2025 });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated");
    });

    it("PUT /:id passes status field to service", async () => {
      svc.editTournament.mockResolvedValue({ ...T, status: TournamentStatus.COMPLETED });
      const res = await request(app)
        .put("/tournaments/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "COMPLETED" });
      expect(res.status).toBe(200);
      expect(svc.editTournament).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: "COMPLETED" })
      );
    });

    it("DELETE /:id deletes a tournament as admin", async () => {
      svc.removeTournament.mockResolvedValue(undefined as unknown as typeof T);
      const res = await request(app)
        .delete("/tournaments/1")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it("POST /:id/activate sets status to ONGOING", async () => {
      svc.setActiveTournament.mockResolvedValue({ ...T, status: TournamentStatus.ONGOING, isActive: true });
      const res = await request(app)
        .post("/tournaments/1/activate")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ONGOING");
      expect(res.body.isActive).toBe(true);
    });

    it("POST /:id/activate returns 404 when tournament not found", async () => {
      svc.setActiveTournament.mockRejectedValue(new HttpError(404, "Tournament not found"));
      const res = await request(app)
        .post("/tournaments/99/activate")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Rules ────────────────────────────────────────────────────────────────────

  describe("Rules", () => {
    it("GET /:id/rules returns the tournament rules", async () => {
      svc.getTournament.mockResolvedValue(RULES_TOURNAMENT);
      const res = await request(app).get("/tournaments/1/rules");
      expect(res.status).toBe(200);
      expect(res.body.rules).toBe("Reglement");
    });

    it("GET /:id/rules returns null when no rules exist", async () => {
      svc.getTournament.mockResolvedValue(T);
      const res = await request(app).get("/tournaments/1/rules");
      expect(res.status).toBe(200);
      expect(res.body.rules).toBeNull();
    });

    it("PUT /:id/rules saves rules as admin", async () => {
      svc.saveTournamentRules.mockResolvedValue(RULES_TOURNAMENT);
      const res = await request(app)
        .put("/tournaments/1/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rules: "Reglement" });
      expect(res.status).toBe(200);
      expect(res.body.rules).toBe("Reglement");
    });

    it("PUT /:id/rules returns 400 when rules is empty", async () => {
      svc.saveTournamentRules.mockRejectedValue(new HttpError(400, "Rules are required"));
      const res = await request(app)
        .put("/tournaments/1/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rules: "" });
      expect(res.status).toBe(400);
    });

    it("PUT /:id/rules returns 401 without auth", async () => {
      const res = await request(app)
        .put("/tournaments/1/rules")
        .send({ rules: "X" });
      expect(res.status).toBe(401);
    });
  });

  // ── Poules ───────────────────────────────────────────────────────────────────

  describe("Poules", () => {
    it("GET /:id/poules returns a list of poules", async () => {
      svc.listPoules.mockResolvedValue([POULE]);
      const res = await request(app).get("/tournaments/1/poules");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Poule A");
    });

    it("GET /:id/poules/:pouleId returns a single poule", async () => {
      svc.getPoule.mockResolvedValue(POULE);
      const res = await request(app).get("/tournaments/1/poules/1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Poule A");
    });

    it("GET /:id/poules/:pouleId returns 404 when not found", async () => {
      svc.getPoule.mockRejectedValue(new HttpError(404, "Poule not found"));
      const res = await request(app).get("/tournaments/1/poules/99");
      expect(res.status).toBe(404);
    });

    it("POST /:id/poules creates a poule as admin", async () => {
      svc.addPoule.mockResolvedValue(POULE);
      const res = await request(app)
        .post("/tournaments/1/poules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Poule A" });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Poule A");
    });

    it("POST /:id/poules returns 401 without auth", async () => {
      const res = await request(app)
        .post("/tournaments/1/poules")
        .send({ name: "Poule A" });
      expect(res.status).toBe(401);
    });

    it("POST /:id/poules returns 403 for non-admin", async () => {
      const res = await request(app)
        .post("/tournaments/1/poules")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ name: "Poule A" });
      expect(res.status).toBe(403);
    });

    it("PUT /:id/poules/:pouleId updates a poule as admin", async () => {
      svc.editPoule.mockResolvedValue({ ...POULE, name: "Poule B" });
      const res = await request(app)
        .put("/tournaments/1/poules/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Poule B" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Poule B");
    });

    it("DELETE /:id/poules/:pouleId deletes a poule as admin", async () => {
      svc.removePoule.mockResolvedValue(undefined as unknown as typeof POULE);
      const res = await request(app)
        .delete("/tournaments/1/poules/1")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

  // ── Teams ─────────────────────────────────────────────────────────────────────

  describe("Teams", () => {
    it("GET /:id/teams returns a list of teams", async () => {
      svc.listTeams.mockResolvedValue([TEAM]);
      const res = await request(app).get("/tournaments/1/teams");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("De Vlaamse Arend");
    });

    it("GET /:id/teams/:teamId returns a single team", async () => {
      svc.getTeam.mockResolvedValue(TEAM);
      const res = await request(app).get("/tournaments/1/teams/1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("De Vlaamse Arend");
    });

    it("GET /:id/teams/:teamId returns 404 when not found", async () => {
      svc.getTeam.mockRejectedValue(new HttpError(404, "Team not found"));
      const res = await request(app).get("/tournaments/1/teams/99");
      expect(res.status).toBe(404);
    });

    it("POST /:id/teams creates a team as admin", async () => {
      svc.addTeam.mockResolvedValue(TEAM);
      const res = await request(app)
        .post("/tournaments/1/teams")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "De Vlaamse Arend",
          players: [
            { name: "Luca", isCaptain: true },
            { name: "Tom" },
            { name: "Wout" },
            { name: "Jens" },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("De Vlaamse Arend");
    });

    it("POST /:id/teams returns 400 when validation fails", async () => {
      svc.addTeam.mockRejectedValue(new HttpError(400, "All player names are required"));
      const res = await request(app)
        .post("/tournaments/1/teams")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "X", players: [{ name: "" }] });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("All player names are required");
    });

    it("POST /:id/teams returns 401 without auth", async () => {
      const res = await request(app).post("/tournaments/1/teams").send({ name: "X" });
      expect(res.status).toBe(401);
    });

    it("PUT /:id/teams/:teamId updates a team as admin", async () => {
      svc.editTeam.mockResolvedValue({ ...TEAM, name: "Updated FC" });
      const res = await request(app)
        .put("/tournaments/1/teams/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated FC" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated FC");
    });

    it("DELETE /:id/teams/:teamId deletes a team as admin", async () => {
      svc.removeTeam.mockResolvedValue(undefined as unknown as typeof TEAM);
      const res = await request(app)
        .delete("/tournaments/1/teams/1")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it("POST /:id/teams/:teamId/checkin marks a team as present", async () => {
      svc.toggleCheckIn.mockResolvedValue({ ...TEAM, isPresent: true });
      const res = await request(app)
        .post("/tournaments/1/teams/1/checkin")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isPresent: true });
      expect(res.status).toBe(200);
      expect(res.body.isPresent).toBe(true);
    });

    it("POST /:id/teams/:teamId/checkin can uncheck a team", async () => {
      svc.toggleCheckIn.mockResolvedValue({ ...TEAM, isPresent: false });
      const res = await request(app)
        .post("/tournaments/1/teams/1/checkin")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isPresent: false });
      expect(res.status).toBe(200);
      expect(res.body.isPresent).toBe(false);
    });
  });

  // ── Matches ───────────────────────────────────────────────────────────────────

  describe("Matches", () => {
    it("GET /:id/matches returns a list of matches", async () => {
      svc.listMatches.mockResolvedValue([MATCH]);
      const res = await request(app).get("/tournaments/1/matches");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("GET /:id/matches?phase=GROUP filters by phase", async () => {
      svc.listMatches.mockResolvedValue([MATCH]);
      const res = await request(app).get("/tournaments/1/matches?phase=GROUP");
      expect(res.status).toBe(200);
      expect(svc.listMatches).toHaveBeenCalledWith(1, { phase: "GROUP", pouleId: undefined });
    });

    it("GET /:id/matches?pouleId=1 filters by poule", async () => {
      svc.listMatches.mockResolvedValue([MATCH]);
      const res = await request(app).get("/tournaments/1/matches?pouleId=1");
      expect(res.status).toBe(200);
      expect(svc.listMatches).toHaveBeenCalledWith(1, { phase: undefined, pouleId: 1 });
    });

    it("GET /:id/matches/:matchId returns a single match", async () => {
      svc.getMatch.mockResolvedValue(MATCH);
      const res = await request(app).get("/tournaments/1/matches/1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it("GET /:id/matches/:matchId returns 404 when not found", async () => {
      svc.getMatch.mockRejectedValue(new HttpError(404, "Match not found"));
      const res = await request(app).get("/tournaments/1/matches/99");
      expect(res.status).toBe(404);
    });

    it("POST /:id/matches creates a match as admin", async () => {
      svc.addMatch.mockResolvedValue(MATCH);
      const res = await request(app)
        .post("/tournaments/1/matches")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ teamAId: 1, teamBId: 2, time: "2025-06-21T09:00:00.000Z", track: 1 });
      expect(res.status).toBe(201);
    });

    it("PUT /:id/matches/:matchId updates a match as admin", async () => {
      svc.editMatch.mockResolvedValue({ ...MATCH, track: 2 });
      const res = await request(app)
        .put("/tournaments/1/matches/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ track: 2 });
      expect(res.status).toBe(200);
      expect(res.body.track).toBe(2);
    });

    it("DELETE /:id/matches/:matchId deletes a match as admin", async () => {
      svc.removeMatch.mockResolvedValue(undefined as unknown as typeof MATCH);
      const res = await request(app)
        .delete("/tournaments/1/matches/1")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it("POST /:id/matches/:matchId/score records a score as admin", async () => {
      svc.recordScore.mockResolvedValue({ ...MATCH, scoreA: 3, scoreB: 1, winnerId: 1 });
      const res = await request(app)
        .post("/tournaments/1/matches/1/score")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ scoreA: 3, scoreB: 1 });
      expect(res.status).toBe(200);
      expect(res.body.scoreA).toBe(3);
      expect(res.body.scoreB).toBe(1);
      expect(res.body.winnerId).toBe(1);
    });

    it("POST /:id/matches/:matchId/score records a draw", async () => {
      svc.recordScore.mockResolvedValue({ ...MATCH, scoreA: 1, scoreB: 1, winnerId: null });
      const res = await request(app)
        .post("/tournaments/1/matches/1/score")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ scoreA: 1, scoreB: 1 });
      expect(res.status).toBe(200);
      expect(res.body.winnerId).toBeNull();
    });

    it("POST /:id/matches/:matchId/score returns 400 for negative score", async () => {
      svc.recordScore.mockRejectedValue(new HttpError(400, "Scores must be non-negative"));
      const res = await request(app)
        .post("/tournaments/1/matches/1/score")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ scoreA: -1, scoreB: 0 });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Scores must be non-negative");
    });

    it("POST /:id/matches/:matchId/score returns 401 without auth", async () => {
      const res = await request(app)
        .post("/tournaments/1/matches/1/score")
        .send({ scoreA: 1, scoreB: 0 });
      expect(res.status).toBe(401);
    });
  });

  // ── Tiebreaker ────────────────────────────────────────────────────────────────

  describe("Tiebreaker", () => {
    it("GET /:id/tiebreaker returns the tiebreaker", async () => {
      svc.getTiebreaker.mockResolvedValue(TIEBREAKER);
      const res = await request(app).get("/tournaments/1/tiebreaker");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it("GET /:id/tiebreaker returns null when none exists", async () => {
      svc.getTiebreaker.mockResolvedValue(null);
      const res = await request(app).get("/tournaments/1/tiebreaker");
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    it("PUT /:id/tiebreaker saves a tiebreaker as admin", async () => {
      svc.saveTiebreaker.mockResolvedValue({ ...TIEBREAKER, teams: [TIEBREAK_TEAM] });
      const res = await request(app)
        .put("/tournaments/1/tiebreaker")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ teamIds: [1, 2] });
      expect(res.status).toBe(200);
      expect(res.body.teams).toHaveLength(1);
    });

    it("PUT /:id/tiebreaker returns 400 when teamIds is empty", async () => {
      svc.saveTiebreaker.mockRejectedValue(new HttpError(400, "At least one team is required"));
      const res = await request(app)
        .put("/tournaments/1/tiebreaker")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ teamIds: [] });
      expect(res.status).toBe(400);
    });

    it("PUT /:id/tiebreaker returns 401 without auth", async () => {
      const res = await request(app)
        .put("/tournaments/1/tiebreaker")
        .send({ teamIds: [1] });
      expect(res.status).toBe(401);
    });

    it("POST /:id/tiebreaker/winner sets the winner as admin", async () => {
      svc.resolveTiebreakerWinner.mockResolvedValue({ ...TIEBREAKER, winnerId: 1 });
      const res = await request(app)
        .post("/tournaments/1/tiebreaker/winner")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ winnerId: 1 });
      expect(res.status).toBe(200);
      expect(res.body.winnerId).toBe(1);
    });

    it("POST /:id/tiebreaker/winner returns 404 when no tiebreaker", async () => {
      svc.resolveTiebreakerWinner.mockRejectedValue(new HttpError(404, "No tiebreaker for this tournament"));
      const res = await request(app)
        .post("/tournaments/1/tiebreaker/winner")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ winnerId: 1 });
      expect(res.status).toBe(404);
    });

    it("POST /:id/tiebreaker/score records a team score as admin", async () => {
      svc.recordTiebreakerScore.mockResolvedValue({ ...TIEBREAK_TEAM, score: 5 });
      const res = await request(app)
        .post("/tournaments/1/tiebreaker/score")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ teamId: 1, score: 5 });
      expect(res.status).toBe(200);
      expect(res.body.score).toBe(5);
    });

    it("POST /:id/tiebreaker/score returns 400 for negative score", async () => {
      svc.recordTiebreakerScore.mockRejectedValue(new HttpError(400, "Score must be non-negative"));
      const res = await request(app)
        .post("/tournaments/1/tiebreaker/score")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ teamId: 1, score: -3 });
      expect(res.status).toBe(400);
    });
  });

  // ── Match generation ──────────────────────────────────────────────────────────

  describe("Match generation", () => {
    it("POST /:id/generate-matches generates group matches as admin", async () => {
      svc.generateGroupMatches.mockResolvedValue({ created: 12 });
      const res = await request(app)
        .post("/tournaments/1/generate-matches")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ startTime: "2025-06-21T09:00:00.000Z", slotMinutes: 25 });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(12);
    });

    it("POST /:id/generate-matches returns 400 when startTime is missing", async () => {
      const res = await request(app)
        .post("/tournaments/1/generate-matches")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ slotMinutes: 25 });
      expect(res.status).toBe(400);
      expect(svc.generateGroupMatches).not.toHaveBeenCalled();
    });

    it("POST /:id/generate-matches returns 400 when slotMinutes is missing", async () => {
      const res = await request(app)
        .post("/tournaments/1/generate-matches")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ startTime: "2025-06-21T09:00:00.000Z" });
      expect(res.status).toBe(400);
      expect(svc.generateGroupMatches).not.toHaveBeenCalled();
    });

    it("POST /:id/generate-matches returns 401 without auth", async () => {
      const res = await request(app)
        .post("/tournaments/1/generate-matches")
        .send({ startTime: "2025-06-21T09:00:00.000Z", slotMinutes: 25 });
      expect(res.status).toBe(401);
    });

    it("POST /:id/generate-matches propagates service errors (400 no poules)", async () => {
      svc.generateGroupMatches.mockRejectedValue(new HttpError(400, "No group-phase poules found"));
      const res = await request(app)
        .post("/tournaments/1/generate-matches")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ startTime: "2025-06-21T09:00:00.000Z", slotMinutes: 25 });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("No group-phase poules found");
    });

    it("POST /:id/generate-knockout generates knockout matches as admin", async () => {
      svc.generateKnockout.mockResolvedValue({ created: 4, totalAdvancing: 4 });
      const res = await request(app)
        .post("/tournaments/1/generate-knockout")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ startTime: "2025-06-21T11:00:00.000Z", slotMinutes: 30 });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(4);
      expect(res.body.totalAdvancing).toBe(4);
    });

    it("POST /:id/generate-knockout returns 400 when startTime is missing", async () => {
      const res = await request(app)
        .post("/tournaments/1/generate-knockout")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ slotMinutes: 30 });
      expect(res.status).toBe(400);
      expect(svc.generateKnockout).not.toHaveBeenCalled();
    });

    it("POST /:id/generate-knockout returns 400 when slotMinutes is missing", async () => {
      const res = await request(app)
        .post("/tournaments/1/generate-knockout")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ startTime: "2025-06-21T11:00:00.000Z" });
      expect(res.status).toBe(400);
      expect(svc.generateKnockout).not.toHaveBeenCalled();
    });

    it("POST /:id/generate-knockout returns 401 without auth", async () => {
      const res = await request(app)
        .post("/tournaments/1/generate-knockout")
        .send({ startTime: "2025-06-21T11:00:00.000Z", slotMinutes: 30 });
      expect(res.status).toBe(401);
    });

    it("POST /:id/apply-delay shifts future match times as admin", async () => {
      svc.applyDelay.mockResolvedValue({ shiftedMinutes: 15, matchesAffected: 6 });
      const res = await request(app)
        .post("/tournaments/1/apply-delay")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ minutes: 15 });
      expect(res.status).toBe(200);
      expect(res.body.shiftedMinutes).toBe(15);
      expect(res.body.matchesAffected).toBe(6);
    });

    it("POST /:id/apply-delay accepts negative minutes (rewind)", async () => {
      svc.applyDelay.mockResolvedValue({ shiftedMinutes: -10, matchesAffected: 4 });
      const res = await request(app)
        .post("/tournaments/1/apply-delay")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ minutes: -10 });
      expect(res.status).toBe(200);
      expect(res.body.shiftedMinutes).toBe(-10);
    });

    it("POST /:id/apply-delay returns 400 for zero minutes", async () => {
      svc.applyDelay.mockRejectedValue(new HttpError(400, "minutes must be a non-zero integer"));
      const res = await request(app)
        .post("/tournaments/1/apply-delay")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ minutes: 0 });
      expect(res.status).toBe(400);
    });

    it("POST /:id/apply-delay returns 401 without auth", async () => {
      const res = await request(app)
        .post("/tournaments/1/apply-delay")
        .send({ minutes: 10 });
      expect(res.status).toBe(401);
    });
  });
});
