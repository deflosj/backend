import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { HttpError } from "../utils/httpError";
import { validate } from "../utils/validate";
import * as service from "../services/shifts.service";
import type { GroupPatch, SlotPatch } from "../services/shifts.service";

// Basic email: requires local-part @ domain . tld
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const unregisterSlotSchema = z.object({
  email: z.string().trim().regex(EMAIL_REGEX, "Ongeldig e-mailadres"),
});

const eventParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
});

const eventTokenParamsSchema = z.object({
  token: z.string().min(1, { message: "Token is verplicht" }),
});

const eventGroupParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
  groupId: z.coerce.number().int().positive({ message: "Invalid group id" }),
});

const eventSlotParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
  slotId: z.coerce.number().int().positive({ message: "Invalid slot id" }),
});

const eventRegistrationParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
  regId: z.coerce.number().int().positive({ message: "Invalid registration id" }),
});

const eventSlotQuerySchema = z.object({
  token: z.string().min(1).optional(),
});

const router = express.Router();

// ── Public: resolve invite token and return groups ─────────────────────────
router.get(
  "/shifts/invite/:token",
  validate({ params: eventTokenParamsSchema }),
  async (req: Request<{ token: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.getInviteWithGroups(req.params.token));
    } catch (err) {
      return next(err);
    }
  }
);

// ── List all shift groups for an event ────────────────────────────────────
router.get(
  "/:id/shifts",
  validate({ params: eventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.listGroups(Number.parseInt(req.params.id, 10)));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Shift stats ────────────────────────────────────────────────────────────
router.get(
  "/:id/shifts/stats",
  validate({ params: eventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.getShiftStats(Number.parseInt(req.params.id, 10)));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Create shift group (admin) ────────────────────────────────────────────
router.post(
  "/:id/shifts/groups",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: eventParamsSchema }),
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
      if (!name?.trim()) return next(new HttpError(400, "Naam is verplicht"));
      const groups = await service.createGroup(eventId, {
        name: name.trim(),
        description,
        color,
        icon,
        sortOrder,
      });
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
  requireAccess("manageContent"),
  validate({ params: eventGroupParamsSchema }),
  async (req: Request<{ id: string; groupId: string }>, res: Response, next: NextFunction) => {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      const { name, description, color, icon, sortOrder } = req.body as Record<
        string,
        string | number | null | undefined
      >;
      const data: GroupPatch = {};
      if (name !== undefined) data.name = name as string;
      if (description !== undefined) data.description = (description as string) ?? null;
      if (color !== undefined) data.color = color as string;
      if (icon !== undefined) data.icon = (icon as string) ?? null;
      if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
      return res.json(await service.updateGroup(groupId, eventId, data));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete shift group (admin) ────────────────────────────────────────────
router.delete(
  "/:id/shifts/groups/:groupId",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: eventGroupParamsSchema }),
  async (req: Request<{ id: string; groupId: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(
        await service.deleteGroup(
          Number.parseInt(req.params.groupId, 10),
          Number.parseInt(req.params.id, 10)
        )
      );
    } catch (err) {
      return next(err);
    }
  }
);

// ── Create shift slot (admin) ─────────────────────────────────────────────
router.post(
  "/:id/shifts/groups/:groupId/slots",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: eventGroupParamsSchema }),
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
      if (!startAt || !endAt)
        return next(new HttpError(400, "Start- en eindtijd zijn verplicht"));
      const groups = await service.createSlot(groupId, eventId, {
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
  requireAccess("manageContent"),
  validate({ params: eventSlotParamsSchema }),
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const slotId = Number.parseInt(req.params.slotId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      const body = req.body as Record<string, unknown>;
      const data: SlotPatch = {};
      if (body.title !== undefined) data.title = (body.title as string) ?? null;
      if (body.startAt !== undefined) data.startAt = new Date(body.startAt as string);
      if (body.endAt !== undefined) data.endAt = new Date(body.endAt as string);
      if (body.maxPersons !== undefined)
        data.maxPersons = body.maxPersons !== null ? Number(body.maxPersons) : null;
      if (body.isUnlimited !== undefined) data.isUnlimited = Boolean(body.isUnlimited);
      if (body.description !== undefined) data.description = (body.description as string) ?? null;
      if (body.location !== undefined) data.location = (body.location as string) ?? null;
      if (body.requiredRole !== undefined) data.requiredRole = (body.requiredRole as string) ?? null;
      if (body.isLocked !== undefined) data.isLocked = Boolean(body.isLocked);
      if (body.isClosed !== undefined) data.isClosed = Boolean(body.isClosed);
      if (body.notes !== undefined) data.notes = (body.notes as string) ?? null;
      return res.json(await service.updateSlot(slotId, eventId, data));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete shift slot (admin) ─────────────────────────────────────────────
router.delete(
  "/:id/shifts/slots/:slotId",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: eventSlotParamsSchema }),
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(
        await service.deleteSlot(
          Number.parseInt(req.params.slotId, 10),
          Number.parseInt(req.params.id, 10)
        )
      );
    } catch (err) {
      return next(err);
    }
  }
);

const slotRegisterSchema = z.object({
  name: z.string().min(1, { message: "Naam is verplicht" }).max(200),
  email: z.string().regex(EMAIL_REGEX, { message: "Ongeldig e-mailadres" }).optional(),
});

// ── Register for slot (public with token, or auth) ────────────────────────
router.post(
  "/:id/shifts/slots/:slotId/register",
  optionalAuth,
  validate({ params: eventSlotParamsSchema, query: eventSlotQuerySchema }),
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query as { token?: string };
      const userId: number | null = req.authUser?.id ?? null;

      if (!userId && token) {
        await service.validateInviteToken(token);
      } else if (!userId) {
        return next(new HttpError(401, "Authenticatie of uitnodigingslink vereist"));
      }

      const parsed = slotRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new HttpError(400, parsed.error.issues.map((e) => e.message).join(", ")));
      }
      const { name, email } = parsed.data;

      const slotId = Number.parseInt(req.params.slotId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      await service.registerForSlot(slotId, eventId, { userId, name, email });
      const groups = await service.listGroups(eventId);
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
  requireAccess("manageContent"),
  validate({ params: eventRegistrationParamsSchema }),
  async (req: Request<{ id: string; regId: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(
        await service.removeRegistration(
          Number.parseInt(req.params.regId, 10),
          Number.parseInt(req.params.id, 10)
        )
      );
    } catch (err) {
      return next(err);
    }
  }
);

// ── Unregister own slot ───────────────────────────────────────────────────
router.delete(
  "/:id/shifts/slots/:slotId/unregister",
  validate({ params: eventSlotParamsSchema, query: eventSlotQuerySchema }),
  async (req: Request<{ id: string; slotId: string }>, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query as { token?: string };
      const parsed = unregisterSlotSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new HttpError(400, parsed.error.issues.map((e) => e.message).join(", ")));
      }
      const { email } = parsed.data;

      if (!req.headers.authorization) {
        if (!token) return next(new HttpError(401, "Authenticatie of uitnodigingslink vereist"));
        await service.validateInviteToken(token);
      }

      const slotId = Number.parseInt(req.params.slotId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      await service.unregisterFromSlot(slotId, email);
      const groups = await service.listGroups(eventId);
      return res.json({ success: true, groups });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
