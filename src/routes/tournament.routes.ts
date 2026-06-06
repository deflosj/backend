import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { Phase } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { validate } from "../utils/validate";
import {
  addMatch,
  addPoule,
  addTeam,
  addTournament,
  applyDelay,
  editMatch,
  editPoule,
  editTeam,
  editTournament,
  generateGroupMatches,
  generateKnockout,
  getActiveTournament,
  getMatch,
  getPoule,
  getTeam,
  getTiebreaker,
  getTournament,
  listMatches,
  listPoules,
  listTeams,
  listTournaments,
  recordScore,
  recordTiebreakerScore,
  removeMatch,
  removePoule,
  removeTeam,
  removeTournament,
  resolveTiebreakerWinner,
  saveTiebreaker,
  saveTournamentRules,
  setActiveTournament,
  toggleCheckIn,
} from "../services/tournament.service";
import {
  createTournamentCode,
  listTournamentCodes,
  redeemTournamentCode,
  removeTournamentCode,
} from "../services/tournamentInviteCode.service";

const tournamentRouter = Router();
const adminOnly = [requireAuth, requireAccess("manageTournament")];
const refereeOrAdmin = [requireAuth, requireAccess("manageTournamentOperations")];

const tournamentIdParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid tournament id" }),
});

const tournamentPouleParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid tournament id" }),
  pouleId: z.coerce.number().int().positive({ message: "Invalid poule id" }),
});

const tournamentTeamParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid tournament id" }),
  teamId: z.coerce.number().int().positive({ message: "Invalid team id" }),
});

const tournamentMatchParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid tournament id" }),
  matchId: z.coerce.number().int().positive({ message: "Invalid match id" }),
});

const tournamentCodeParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid tournament id" }),
  codeId: z.coerce.number().int().positive({ message: "Invalid invite code id" }),
});

const PHASE_VALUES = Object.values(Phase) as [Phase, ...Phase[]];

const tournamentMatchesQuerySchema = z.object({
  phase: z.enum(PHASE_VALUES).optional(),
  pouleId: z.coerce.number().int().positive().optional(),
});

// ── Tournaments ───────────────────────────────────────────────────────────────

tournamentRouter.get("/", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listTournaments());
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/active", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getActiveTournament());
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id", validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTournament(Number.parseInt(req.params.id, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(await addTournament({
      name: req.body.name,
      year: req.body.year,
      teamsPerPoule: req.body.teamsPerPoule ?? null,
      teamsAdvancingPerPoule: req.body.teamsAdvancingPerPoule ?? null,
      bestNthsAdvancing: req.body.bestNthsAdvancing ?? null,
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await editTournament(Number.parseInt(req.params.id, 10), {
      name: req.body.name,
      year: req.body.year,
      teamsPerPoule: req.body.teamsPerPoule,
      teamsAdvancingPerPoule: req.body.teamsAdvancingPerPoule,
      bestNthsAdvancing: req.body.bestNthsAdvancing,
      status: req.body.status,
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeTournament(Number.parseInt(req.params.id, 10));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/activate", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await setActiveTournament(Number.parseInt(req.params.id, 10)));
  } catch (e) {
    next(e);
  }
});

// ── Rules ─────────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/rules", validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await getTournament(Number.parseInt(req.params.id, 10));
    res.json({ rules: t.rules ?? null, rulesUpdatedAt: t.rulesUpdatedAt ?? null });
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/rules", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await saveTournamentRules(Number.parseInt(req.params.id, 10), req.body.rules);
    res.json({ rules: t.rules, rulesUpdatedAt: t.rulesUpdatedAt });
  } catch (e) {
    next(e);
  }
});

// ── Poules ────────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/poules", validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listPoules(Number.parseInt(req.params.id, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/poules", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await addPoule(Number.parseInt(req.params.id, 10), {
        name: req.body.name,
        description: req.body.description ?? null,
        phase: req.body.phase ?? Phase.GROUP_STAGE,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/poules/:pouleId", ...adminOnly, validate({ params: tournamentPouleParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await editPoule(Number.parseInt(req.params.pouleId, 10), { name: req.body.name, description: req.body.description, phase: req.body.phase }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/poules/:pouleId", ...adminOnly, validate({ params: tournamentPouleParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removePoule(Number.parseInt(req.params.pouleId, 10));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/poules/:pouleId", validate({ params: tournamentPouleParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getPoule(Number.parseInt(req.params.pouleId, 10)));
  } catch (e) {
    next(e);
  }
});

// ── Teams ─────────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/teams", validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listTeams(Number.parseInt(req.params.id, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/teams/:teamId", validate({ params: tournamentTeamParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTeam(Number.parseInt(req.params.teamId, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/teams", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await addTeam(Number.parseInt(req.params.id, 10), {
        name: req.body.name,
        logoUrl: req.body.logoUrl ?? null,
        pouleId: req.body.pouleId ?? null,
        captainId: req.body.captainId ?? null,
        players: req.body.players ?? [],
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/teams/:teamId", ...adminOnly, validate({ params: tournamentTeamParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(
      await editTeam(Number.parseInt(req.params.teamId, 10), {
        name: req.body.name,
        logoUrl: req.body.logoUrl,
        pouleId: req.body.pouleId,
        captainId: req.body.captainId,
        players: req.body.players,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/teams/:teamId", ...adminOnly, validate({ params: tournamentTeamParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeTeam(Number.parseInt(req.params.teamId, 10));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/teams/:teamId/checkin", ...refereeOrAdmin, validate({ params: tournamentTeamParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await toggleCheckIn(Number.parseInt(req.params.teamId, 10), Boolean(req.body.isPresent)));
  } catch (e) {
    next(e);
  }
});

// ── Matches ───────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/matches", validate({ params: tournamentIdParamsSchema, query: tournamentMatchesQuerySchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const phase = req.query.phase as Phase | undefined;
    const pouleId = req.query.pouleId ? Number.parseInt(req.query.pouleId as string, 10) : undefined;
    res.json(await listMatches(Number.parseInt(req.params.id, 10), { phase, pouleId }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/matches/:matchId", validate({ params: tournamentMatchParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getMatch(Number.parseInt(req.params.matchId, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/matches", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await addMatch(Number.parseInt(req.params.id, 10), {
        pouleId: req.body.pouleId ?? null,
        teamAId: req.body.teamAId ?? null,
        teamBId: req.body.teamBId ?? null,
        scheduledAt: req.body.time ? new Date(req.body.time) : undefined,
        track: req.body.track ?? null,
        phase: req.body.phase ?? Phase.GROUP_STAGE,
        bracketPos: req.body.bracketPos ?? null,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/matches/:matchId", ...adminOnly, validate({ params: tournamentMatchParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(
      await editMatch(Number.parseInt(req.params.matchId, 10), {
        pouleId: req.body.pouleId,
        teamAId: req.body.teamAId,
        teamBId: req.body.teamBId,
        scheduledAt: req.body.time ? new Date(req.body.time) : undefined,
        track: req.body.track,
        phase: req.body.phase,
        bracketPos: req.body.bracketPos,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/matches/:matchId", ...adminOnly, validate({ params: tournamentMatchParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeMatch(Number.parseInt(req.params.matchId, 10));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/matches/:matchId/score", ...refereeOrAdmin, validate({ params: tournamentMatchParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await recordScore(Number.parseInt(req.params.matchId, 10), Number.parseInt(req.body.scoreA, 10), Number.parseInt(req.body.scoreB, 10)));
  } catch (e) {
    next(e);
  }
});

// ── Tiebreaker ────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/tiebreaker", validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTiebreaker(Number.parseInt(req.params.id, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/tiebreaker", ...refereeOrAdmin, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await saveTiebreaker(Number.parseInt(req.params.id, 10), req.body.teamIds));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/tiebreaker/winner", ...refereeOrAdmin, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await resolveTiebreakerWinner(Number.parseInt(req.params.id, 10), Number.parseInt(req.body.winnerId, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/tiebreaker/score", ...refereeOrAdmin, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await recordTiebreakerScore(Number.parseInt(req.params.id, 10), Number.parseInt(req.body.teamId, 10), Number.parseInt(req.body.score, 10)));
  } catch (e) {
    next(e);
  }
});

// ── Match generation ──────────────────────────────────────────────────────────

tournamentRouter.post("/:id/generate-matches", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startTime, slotMinutes, firstTrack } = req.body;
    if (!startTime) { next(new HttpError(400, "startTime is required")); return; }
    if (!slotMinutes) { next(new HttpError(400, "slotMinutes is required")); return; }
    res.status(201).json(await generateGroupMatches(Number.parseInt(req.params.id, 10), {
      startTime: new Date(startTime),
      slotMinutes: Number.parseInt(slotMinutes, 10),
      firstTrack: firstTrack ? Number.parseInt(firstTrack, 10) : undefined,
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/generate-knockout", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startTime, slotMinutes } = req.body;
    if (!startTime) { next(new HttpError(400, "startTime is required")); return; }
    if (!slotMinutes) { next(new HttpError(400, "slotMinutes is required")); return; }
    res.status(201).json(await generateKnockout(Number.parseInt(req.params.id, 10), {
      startTime: new Date(startTime),
      slotMinutes: Number.parseInt(slotMinutes, 10),
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/apply-delay", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await applyDelay(Number.parseInt(req.params.id, 10), Number.parseInt(req.body.minutes, 10)));
  } catch (e) {
    next(e);
  }
});

// ── Tournament invite codes (admin) ───────────────────────────────────────────

tournamentRouter.get("/:id/invite-codes", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listTournamentCodes(Number.parseInt(req.params.id, 10)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/invite-codes", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await createTournamentCode(
        Number.parseInt(req.params.id, 10),
        req.body.label,
        req.authUser!.id
      )
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/invite-codes/:codeId", ...adminOnly, validate({ params: tournamentCodeParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeTournamentCode(
      Number.parseInt(req.params.codeId, 10),
      Number.parseInt(req.params.id, 10)
    );
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ── Redeem invite code (any authenticated user) ───────────────────────────────

tournamentRouter.post("/:id/redeem", requireAuth, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await redeemTournamentCode(
        Number.parseInt(req.params.id, 10),
        req.authUser!.id,
        {
          code: req.body.code,
          teamName: req.body.teamName,
          players: req.body.players ?? [],
          logoUrl: req.body.logoUrl ?? null,
        }
      )
    );
  } catch (e) {
    next(e);
  }
});

// ── Captain self-service team management ──────────────────────────────────────

tournamentRouter.get("/:id/my-team", requireAuth, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournamentId = Number.parseInt(req.params.id, 10);
    const teams = await listTeams(tournamentId);
    const myTeam = teams.find((t) => t.captainId === req.authUser!.id);
    if (!myTeam) { next(new HttpError(404, "You do not have a team in this tournament")); return; }
    res.json(await getTeam(myTeam.id));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/my-team", requireAuth, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournamentId = Number.parseInt(req.params.id, 10);
    const teams = await listTeams(tournamentId);
    const myTeam = teams.find((t) => t.captainId === req.authUser!.id);
    if (!myTeam) { next(new HttpError(404, "You do not have a team in this tournament")); return; }
    res.json(
      await editTeam(myTeam.id, {
        name: req.body.name,
        logoUrl: req.body.logoUrl,
        players: req.body.players,
      })
    );
  } catch (e) {
    next(e);
  }
});

export default tournamentRouter;
