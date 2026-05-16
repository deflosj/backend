import { NextFunction, Request, Response, Router } from "express";
import { Phase } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/authorizeRole";
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
} from "../services/tournamentService";

const tournamentRouter = Router();
const adminOnly = [requireAuth, requireRole("ADMIN")];

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

tournamentRouter.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTournament(Number(req.params.id)));
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

tournamentRouter.put("/:id", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await editTournament(Number(req.params.id), {
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

tournamentRouter.delete("/:id", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeTournament(Number(req.params.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/activate", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await setActiveTournament(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

// ── Rules ─────────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/rules", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await getTournament(Number(req.params.id));
    res.json(t.rules ?? null);
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/rules", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await saveTournamentRules(Number(req.params.id), req.body.description));
  } catch (e) {
    next(e);
  }
});

// ── Poules ────────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/poules", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listPoules(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/poules", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await addPoule(Number(req.params.id), {
        name: req.body.name,
        description: req.body.description ?? null,
        phase: req.body.phase ?? Phase.GROUP,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/poules/:pouleId", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await editPoule(Number(req.params.pouleId), { name: req.body.name, description: req.body.description, phase: req.body.phase }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/poules/:pouleId", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removePoule(Number(req.params.pouleId));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/poules/:pouleId", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getPoule(Number(req.params.pouleId)));
  } catch (e) {
    next(e);
  }
});

// ── Teams ─────────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/teams", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listTeams(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/teams/:teamId", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTeam(Number(req.params.teamId)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/teams", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await addTeam(Number(req.params.id), {
        name: req.body.name,
        logoUrl: req.body.logoUrl ?? null,
        pouleId: req.body.pouleId ?? null,
        captainId: req.body.captainId ?? null,
        captainName: req.body.captainName,
        speler1: req.body.speler1,
        speler2: req.body.speler2,
        speler3: req.body.speler3,
        speler4: req.body.speler4,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/teams/:teamId", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(
      await editTeam(Number(req.params.teamId), {
        name: req.body.name,
        logoUrl: req.body.logoUrl,
        pouleId: req.body.pouleId,
        captainId: req.body.captainId,
        captainName: req.body.captainName,
        speler1: req.body.speler1,
        speler2: req.body.speler2,
        speler3: req.body.speler3,
        speler4: req.body.speler4,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/teams/:teamId", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeTeam(Number(req.params.teamId));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/teams/:teamId/checkin", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await toggleCheckIn(Number(req.params.teamId), Boolean(req.body.isPresent)));
  } catch (e) {
    next(e);
  }
});

// ── Matches ───────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/matches", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const phase = req.query.phase as Phase | undefined;
    const pouleId = req.query.pouleId ? Number(req.query.pouleId) : undefined;
    res.json(await listMatches(Number(req.params.id), { phase, pouleId }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/matches/:matchId", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getMatch(Number(req.params.matchId)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/matches", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(
      await addMatch(Number(req.params.id), {
        pouleId: req.body.pouleId ?? null,
        teamAId: req.body.teamAId ?? null,
        teamBId: req.body.teamBId ?? null,
        time: req.body.time ? new Date(req.body.time) : undefined,
        track: req.body.track ?? null,
        phase: req.body.phase ?? Phase.GROUP,
        bracketPos: req.body.bracketPos ?? null,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/matches/:matchId", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(
      await editMatch(Number(req.params.matchId), {
        pouleId: req.body.pouleId,
        teamAId: req.body.teamAId,
        teamBId: req.body.teamBId,
        time: req.body.time ? new Date(req.body.time) : undefined,
        track: req.body.track,
        phase: req.body.phase,
        bracketPos: req.body.bracketPos,
      })
    );
  } catch (e) {
    next(e);
  }
});

tournamentRouter.delete("/:id/matches/:matchId", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await removeMatch(Number(req.params.matchId));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/matches/:matchId/score", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await recordScore(Number(req.params.matchId), Number(req.body.scoreA), Number(req.body.scoreB)));
  } catch (e) {
    next(e);
  }
});

// ── Tiebreaker ────────────────────────────────────────────────────────────────

tournamentRouter.get("/:id/tiebreaker", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTiebreaker(Number(req.params.id)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.put("/:id/tiebreaker", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await saveTiebreaker(Number(req.params.id), req.body.teamIds));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/tiebreaker/winner", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await resolveTiebreakerWinner(Number(req.params.id), Number(req.body.winnerId)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/tiebreaker/score", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await recordTiebreakerScore(Number(req.params.id), Number(req.body.teamId), Number(req.body.score)));
  } catch (e) {
    next(e);
  }
});

// ── Match generation ──────────────────────────────────────────────────────────

tournamentRouter.post("/:id/generate-matches", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startTime, slotMinutes, firstTrack } = req.body;
    if (!startTime) { res.status(400).json({ message: "startTime is required" }); return; }
    if (!slotMinutes) { res.status(400).json({ message: "slotMinutes is required" }); return; }
    res.status(201).json(await generateGroupMatches(Number(req.params.id), {
      startTime: new Date(startTime),
      slotMinutes: Number(slotMinutes),
      firstTrack: firstTrack ? Number(firstTrack) : undefined,
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/generate-knockout", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startTime, slotMinutes } = req.body;
    if (!startTime) { res.status(400).json({ message: "startTime is required" }); return; }
    if (!slotMinutes) { res.status(400).json({ message: "slotMinutes is required" }); return; }
    res.status(201).json(await generateKnockout(Number(req.params.id), {
      startTime: new Date(startTime),
      slotMinutes: Number(slotMinutes),
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/apply-delay", ...adminOnly, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await applyDelay(Number(req.params.id), Number(req.body.minutes)));
  } catch (e) {
    next(e);
  }
});

export default tournamentRouter;
