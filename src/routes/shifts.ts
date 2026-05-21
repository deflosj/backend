import express, { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import * as repo from "../repositories/shiftRepository";
import * as helpersRepo from "../repositories/helpersRepository";

const router = express.Router();

// ── Public: resolve invite token and return groups ─────────────────────────
router.get(
  "/shifts/invite/:token",
  async (req: Request<{ token: string }>, res: Response, next: NextFunction) => {
    try {
      const invite = await helpersRepo.findInviteToken(req.params.token);
      if (!invite) return res.status(404).json({ error: "Ongeldige of verlopen uitnodigingslink" });
      const groups = await repo.listGroupsByEvent(invite.eventId);
      return res.json({ event: invite.event, groups });
    } catch (err) {
      return next(err);
    }
  }
);

// ── List all shift groups for an event ────────────────────────────────────
router.get(
  "/:id/shifts",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Shift stats ────────────────────────────────────────────────────────────
router.get(
  "/:id/shifts/stats",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const stats = await repo.getEventShiftStats(eventId);
      return res.json(stats);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Create shift group (admin) ────────────────────────────────────────────
router.post(
  "/:id/shifts/groups",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const { name, description, color, icon, sortOrder } = req.body as {
        name?: string;
        description?: string | null;
        color?: string;
        icon?: string | null;
        sortOrder?: number;
      };
      if (!name?.trim()) return res.status(400).json({ error: "Naam is verplicht" });
      await repo.createGroup(eventId, { name: name.trim(), description, color, icon, sortOrder });
      const groups = await repo.listGroupsByEvent(eventId);
      return res.status(201).json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Update shift group (admin) ────────────────────────────────────────────
router.patch(
  "/:id/shifts/groups/:groupId",
  requireAuth,
  async (req: Request<{ id: string; groupId: string }>, res: Response, next: NextFunction) => {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      const { name, description, color, icon, sortOrder } = req.body as Record<string, string | number | null | undefined>;
      const data: Parameters<typeof repo.updateGroup>[1] = {};
      if (name !== undefined) data.name = name as string;
      if (description !== undefined) data.description = (description as string) ?? null;
      if (color !== undefined) data.color = color as string;
      if (icon !== undefined) data.icon = (icon as string) ?? null;
      if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
      await repo.updateGroup(groupId, data);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete shift group (admin) ────────────────────────────────────────────
router.delete(
  "/:id/shifts/groups/:groupId",
  requireAuth,
  async (req: Request<{ id: string; groupId: string }>, res: Response, next: NextFunction) => {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      await repo.deleteGroup(groupId);
      const eventId = Number.parseInt(req.params.id, 10);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Create shift slot (admin) ─────────────────────────────────────────────
router.post(
  "/:id/shifts/groups/:groupId/slots",
  requireAuth,
  async (req: Request<{ id: string; groupId: string }>, res: Response, next: NextFunction) => {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      const { startAt, endAt, title, maxPersons, isUnlimited, description, location, requiredRole, notes } =
        req.body as {
          startAt?: string;
          endAt?: string;
          title?: string | null;
          maxPersons?: number | null;
          isUnlimited?: boolean;
          description?: string | null;
          location?: string | null;
          requiredRole?: string | null;
          notes?: string | null;
        };
      if (!startAt || !endAt) return res.status(400).json({ error: "Start- en eindtijd zijn verplicht" });
      await repo.createSlot(groupId, {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        title: title ?? null,
        maxPersons: isUnlimited ? null : (maxPersons ?? null),
        isUnlimited: isUnlimited ?? false,
        description: description ?? null,
        location: location ?? null,
        requiredRole: requiredRole ?? null,
        notes: notes ?? null,
      });
      const groups = await repo.listGroupsByEvent(eventId);
      return res.status(201).json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Update shift slot (admin) ─────────────────────────────────────────────
router.patch(
  "/:id/shifts/slots/:slotId",
  requireAuth,
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const slotId = Number.parseInt(req.params.slotId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      const body = req.body as Record<string, unknown>;
      const data: Parameters<typeof repo.updateSlot>[1] = {};
      if (body.title !== undefined) data.title = (body.title as string) ?? null;
      if (body.startAt !== undefined) data.startAt = new Date(body.startAt as string);
      if (body.endAt !== undefined) data.endAt = new Date(body.endAt as string);
      if (body.maxPersons !== undefined) data.maxPersons = body.maxPersons !== null ? Number(body.maxPersons) : null;
      if (body.isUnlimited !== undefined) data.isUnlimited = Boolean(body.isUnlimited);
      if (body.description !== undefined) data.description = (body.description as string) ?? null;
      if (body.location !== undefined) data.location = (body.location as string) ?? null;
      if (body.requiredRole !== undefined) data.requiredRole = (body.requiredRole as string) ?? null;
      if (body.isLocked !== undefined) data.isLocked = Boolean(body.isLocked);
      if (body.isClosed !== undefined) data.isClosed = Boolean(body.isClosed);
      if (body.notes !== undefined) data.notes = (body.notes as string) ?? null;
      await repo.updateSlot(slotId, data);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete shift slot (admin) ─────────────────────────────────────────────
router.delete(
  "/:id/shifts/slots/:slotId",
  requireAuth,
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const slotId = Number.parseInt(req.params.slotId, 10);
      await repo.deleteSlot(slotId);
      const eventId = Number.parseInt(req.params.id, 10);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Register for slot (public with token, or auth) ────────────────────────
router.post(
  "/:id/shifts/slots/:slotId/register",
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query as { token?: string };
      const { name, email } = req.body as { name?: string; email?: string };
      let userId: number | null = null;

      if (req.headers.authorization) {
        try {
          requireAuth(req as any, res as any, (e?: unknown) => { if (e) throw e; });
          userId = (req as any).authUser?.id ?? null;
        } catch { userId = null; }
      }

      if (!userId && token) {
        const invite = await helpersRepo.findInviteToken(token);
        if (!invite) return res.status(401).json({ error: "Ongeldige uitnodigingslink" });
      } else if (!userId) {
        return res.status(401).json({ error: "Authenticatie of uitnodigingslink vereist" });
      }

      if (!name?.trim()) return res.status(400).json({ error: "Naam is verplicht" });

      const slotId = Number.parseInt(req.params.slotId, 10);
      const slot = await repo.findSlotById(slotId);
      if (!slot) return res.status(404).json({ error: "Shift-slot niet gevonden" });
      if (slot.isClosed) return res.status(409).json({ error: "Registraties zijn gesloten" });
      if (slot.isLocked) return res.status(409).json({ error: "Dit slot is vergrendeld" });

      // Capacity check
      if (!slot.isUnlimited && slot.maxPersons !== null) {
        const count = await repo.countSlotRegistrations(slotId);
        if (count >= slot.maxPersons) return res.status(409).json({ error: "Dit slot is al vol" });
      }

      // Conflict detection: check for overlapping registrations by same email
      if (email) {
        const eventId = Number.parseInt(req.params.id, 10);
        const existing = await repo.findRegistrationsByEmail(email, eventId);
        const slotStart = slot.startAt.getTime();
        const slotEnd = slot.endAt.getTime();
        const conflict = existing.find((r) => {
          const s = r.slot.startAt.getTime();
          const e = r.slot.endAt.getTime();
          return s < slotEnd && e > slotStart;
        });
        if (conflict) return res.status(409).json({ error: "Je hebt al een shift die overlaps met dit tijdslot" });
      }

      await repo.addRegistration(slotId, {
        userId,
        name: name.trim(),
        email: email?.trim() || null,
      });

      const eventId = Number.parseInt(req.params.id, 10);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json({ success: true, groups });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Remove registration (admin) ───────────────────────────────────────────
router.delete(
  "/:id/shifts/registrations/:regId",
  requireAuth,
  async (req: Request<{ id: string; regId: string }>, res: Response, next: NextFunction) => {
    try {
      const regId = Number.parseInt(req.params.regId, 10);
      await repo.removeRegistration(regId);
      const eventId = Number.parseInt(req.params.id, 10);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json(groups);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Unregister own slot ───────────────────────────────────────────────────
router.delete(
  "/:id/shifts/slots/:slotId/unregister",
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const { token, email } = req.query as { token?: string; email?: string };
      if (!email) return res.status(400).json({ error: "E-mail is verplicht" });

      if (!req.headers.authorization && token) {
        const invite = await helpersRepo.findInviteToken(token);
        if (!invite) return res.status(401).json({ error: "Ongeldige uitnodigingslink" });
      }

      const slotId = Number.parseInt(req.params.slotId, 10);
      await repo.removeRegistrationByEmail(slotId, email);
      const eventId = Number.parseInt(req.params.id, 10);
      const groups = await repo.listGroupsByEvent(eventId);
      return res.json({ success: true, groups });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
