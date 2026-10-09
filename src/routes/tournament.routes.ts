import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { Phase } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { ROLE_MANAGER } from "../config/roleManager";
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
  generatePoules,
  generateKnockout,
  getActiveTournament,
  getMatch,
  getTournamentView,
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
  selfRegisterTeam,
  setActiveTournament,
  toggleCheckIn,
} from "../services/tournament.service";
import {
  getTeamPortal,
  saveTeamPortalLogo,
  sendPortalLink,
  updateTeamPortal,
} from "../services/teamPortal.service";
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

const portalTokenParamsSchema = z.object({
  token: z.string().min(8, { message: "Invalid token" }),
});

/** Wie het toernooi beheert, krijgt de portaaltokens en e-mailadressen mee;
 *  iedereen anders niet. Zie teamPortal.service. */
const canManageTournament = (req: Request): boolean =>
  Boolean(req.authUser && (ROLE_MANAGER.manageTournament.roles as readonly string[]).includes(req.authUser.role));

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

tournamentRouter.get("/active", optionalAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getActiveTournament(canManageTournament(req)));
  } catch (e) {
    next(e);
  }
});

// ── Zelf aanmelden (publiek — QR-code in het café) ───────────────────────────

tournamentRouter.post("/active/self-register", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(await selfRegisterTeam({
      name: req.body?.name,
      captainName: req.body?.captainName,
      email: req.body?.email ?? null,
      phone: req.body?.phone,
      speler1: req.body?.speler1,
      speler2: req.body?.speler2,
      speler3: req.body?.speler3,
      speler4: req.body?.speler4,
    }));
  } catch (e) {
    next(e);
  }
});

// ── Teamportaal (publiek — de token is de sleutel) ────────────────────────────

tournamentRouter.get("/teams/portal/:token", validate({ params: portalTokenParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTeamPortal(req.params.token));
  } catch (e) {
    next(e);
  }
});

const savePortal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await updateTeamPortal(req.params.token, {
      name: req.body.name,
      speler1: req.body.speler1,
      speler2: req.body.speler2,
      speler3: req.body.speler3,
      speler4: req.body.speler4,
    }));
  } catch (e) {
    next(e);
  }
};

tournamentRouter.patch("/teams/portal/:token", validate({ params: portalTokenParamsSchema }), savePortal);
tournamentRouter.put("/teams/portal/:token", validate({ params: portalTokenParamsSchema }), savePortal);

tournamentRouter.post("/teams/portal/:token/logo", validate({ params: portalTokenParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { logoUrl, portal } = await saveTeamPortalLogo(req.params.token, req.body.dataUrl);
    res.json({ logoUrl, ...portal });
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id", optionalAuth, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTournamentView(Number.parseInt(req.params.id, 10), canManageTournament(req)));
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
      trackCount: req.body.trackCount ?? undefined,
    }));
  } catch (e) {
    next(e);
  }
});

const parseDeadline = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new HttpError(400, "teamEditDeadline is not a valid date");
  return d;
};

const saveTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await editTournament(Number.parseInt(req.params.id, 10), {
      name: req.body.name,
      year: req.body.year,
      teamsPerPoule: req.body.teamsPerPoule,
      teamsAdvancingPerPoule: req.body.teamsAdvancingPerPoule,
      bestNthsAdvancing: req.body.bestNthsAdvancing,
      trackCount: req.body.trackCount === undefined ? undefined : Number.parseInt(req.body.trackCount, 10),
      status: req.body.status,
      teamEditDeadline: parseDeadline(req.body.teamEditDeadline),
    }));
  } catch (e) {
    next(e);
  }
};

tournamentRouter.put("/:id", ...adminOnly, validate({ params: tournamentIdParamsSchema }), saveTournament);
tournamentRouter.patch("/:id", ...adminOnly, validate({ params: tournamentIdParamsSchema }), saveTournament);

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

const savePoule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await editPoule(Number.parseInt(req.params.pouleId, 10), { name: req.body.name, description: req.body.description, phase: req.body.phase }));
  } catch (e) {
    next(e);
  }
};

tournamentRouter.put("/:id/poules/:pouleId", ...adminOnly, validate({ params: tournamentPouleParamsSchema }), savePoule);
tournamentRouter.patch("/:id/poules/:pouleId", ...adminOnly, validate({ params: tournamentPouleParamsSchema }), savePoule);

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

tournamentRouter.get("/:id/teams", optionalAuth, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listTeams(Number.parseInt(req.params.id, 10), canManageTournament(req)));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.get("/:id/teams/:teamId", optionalAuth, validate({ params: tournamentTeamParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getTeam(Number.parseInt(req.params.teamId, 10), canManageTournament(req)));
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
        captainName: req.body.captainName ?? null,
        email: req.body.email ?? null,
        phone: req.body.phone ?? null,
        isPaid: req.body.isPaid ?? false,
        paymentMethod: req.body.paymentMethod ?? null,
        isPresent: req.body.isPresent ?? false,
        speler1: req.body.speler1 ?? "",
        speler2: req.body.speler2 ?? "",
        speler3: req.body.speler3 ?? "",
        speler4: req.body.speler4 ?? "",
      })
    );
  } catch (e) {
    next(e);
  }
});

const saveTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(
      await editTeam(Number.parseInt(req.params.teamId, 10), {
        name: req.body.name,
        logoUrl: req.body.logoUrl,
        pouleId: req.body.pouleId,
        captainId: req.body.captainId,
        captainName: req.body.captainName,
        email: req.body.email,
        phone: req.body.phone,
        isPaid: req.body.isPaid,
        paymentMethod: req.body.paymentMethod,
        isPresent: req.body.isPresent,
        speler1: req.body.speler1,
        speler2: req.body.speler2,
        speler3: req.body.speler3,
        speler4: req.body.speler4,
      })
    );
  } catch (e) {
    next(e);
  }
};

tournamentRouter.put("/:id/teams/:teamId", ...adminOnly, validate({ params: tournamentTeamParamsSchema }), saveTeam);
tournamentRouter.patch("/:id/teams/:teamId", ...adminOnly, validate({ params: tournamentTeamParamsSchema }), saveTeam);

tournamentRouter.post("/:id/teams/:teamId/send-link", ...adminOnly, validate({ params: tournamentTeamParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await sendPortalLink(Number.parseInt(req.params.teamId, 10), req.body.email));
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

/** Eén opslagknop in het beheerscherm zet ploegen, tijd, baan én score. De
 *  score loopt via `recordScore`, zodat de winnaar meteen doorschuift naar de
 *  volgende bracketronde. */
/** Aan de wedstrijdtafel typt men "15:00", niet een ISO-tijdstip. Een uur
 *  zonder datum wordt op de dag van de wedstrijd geplakt. */
const parseMatchTime = (value: unknown, current: Date | null): Date | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const raw = String(value).trim();

  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (hhmm) {
    const base = current ? new Date(current) : new Date();
    base.setHours(Number.parseInt(hhmm[1], 10), Number.parseInt(hhmm[2], 10), 0, 0);
    return base;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new HttpError(400, "Tijd is geen geldig tijdstip (verwacht bv. 15:00).");
  return parsed;
};

const saveMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matchId = Number.parseInt(req.params.matchId, 10);
    const current = await getMatch(matchId);
    let match = await editMatch(matchId, {
      pouleId: req.body.pouleId,
      teamAId: req.body.teamAId,
      teamBId: req.body.teamBId,
      scheduledAt: parseMatchTime(req.body.time, current.scheduledAt),
      track: req.body.track,
      phase: req.body.phase,
      bracketPos: req.body.bracketPos,
    });

    if (req.body.scoreA !== undefined && req.body.scoreA !== null &&
        req.body.scoreB !== undefined && req.body.scoreB !== null) {
      match = await recordScore(matchId, Number.parseInt(req.body.scoreA, 10), Number.parseInt(req.body.scoreB, 10));
    }

    res.json(match);
  } catch (e) {
    next(e);
  }
};

tournamentRouter.put("/:id/matches/:matchId", ...adminOnly, validate({ params: tournamentMatchParamsSchema }), saveMatch);
tournamentRouter.patch("/:id/matches/:matchId", ...adminOnly, validate({ params: tournamentMatchParamsSchema }), saveMatch);

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

tournamentRouter.post("/:id/generate-poules", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { teamsPerPoule, onlyPresent } = req.body ?? {};
    res.status(201).json(await generatePoules(Number.parseInt(req.params.id, 10), {
      teamsPerPoule: teamsPerPoule ? Number.parseInt(teamsPerPoule, 10) : undefined,
      onlyPresent: onlyPresent === true,
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/generate-matches", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startTime, slotMinutes, trackCount } = req.body;
    if (!startTime) { next(new HttpError(400, "startTime is required")); return; }
    if (!slotMinutes) { next(new HttpError(400, "slotMinutes is required")); return; }
    res.status(201).json(await generateGroupMatches(Number.parseInt(req.params.id, 10), {
      startTime: new Date(startTime),
      slotMinutes: Number.parseInt(slotMinutes, 10),
      trackCount: trackCount ? Number.parseInt(trackCount, 10) : undefined,
    }));
  } catch (e) {
    next(e);
  }
});

tournamentRouter.post("/:id/generate-knockout", ...adminOnly, validate({ params: tournamentIdParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startTime, slotMinutes, breakMinutes, trackCount, withConsolation, force } = req.body;
    if (!startTime) { next(new HttpError(400, "startTime is required")); return; }
    if (!slotMinutes) { next(new HttpError(400, "slotMinutes is required")); return; }
    res.status(201).json(await generateKnockout(Number.parseInt(req.params.id, 10), {
      startTime: new Date(startTime),
      slotMinutes: Number.parseInt(slotMinutes, 10),
      breakMinutes: breakMinutes === undefined ? undefined : Number.parseInt(breakMinutes, 10),
      trackCount: trackCount ? Number.parseInt(trackCount, 10) : undefined,
      withConsolation: withConsolation === undefined ? undefined : Boolean(withConsolation),
      force: force === true,
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
          speler1: req.body.speler1 ?? "",
          speler2: req.body.speler2 ?? "",
          speler3: req.body.speler3 ?? "",
          speler4: req.body.speler4 ?? "",
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

export default tournamentRouter;
