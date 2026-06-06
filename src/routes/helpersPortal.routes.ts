import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { HttpError } from "../utils/httpError";
import { RSVPStatus, Shift, TaskStatus } from "@prisma/client";
import * as service from "../services/helpers.service";
import type { TaskPatch } from "../services/helpers.service";
import { validate } from "../utils/validate";

const router = express.Router();

const portalTokenParamsSchema = z.object({
  token: z.string().min(1, { message: "Token is verplicht" }),
});

const portalEventParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
});

const portalTaskParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
  taskId: z.coerce.number().int().positive({ message: "Invalid task id" }),
});

const portalTaskAssigneeParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
  taskId: z.coerce.number().int().positive({ message: "Invalid task id" }),
  assigneeId: z.coerce.number().int().positive({ message: "Invalid assignee id" }),
});

const portalAttendanceParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid event id" }),
  aid: z.coerce.number().int().positive({ message: "Invalid attendance id" }),
});

const portalClaimQuerySchema = z.object({
  token: z.string().min(1).optional(),
});

const portalYearQuerySchema = z.object({
  year: z.coerce.number().int().positive().optional(),
});

// ── Public invite token lookup ─────────────────────────────────────────────
router.get(
  "/portal/invite/:token",
  validate({ params: portalTokenParamsSchema }),
  async (req: Request<{ token: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.getInviteWithTasks(req.params.token));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Task stats ─────────────────────────────────────────────────────────────
router.get(
  "/:id/portal/stats",
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.getEventTaskStats(Number.parseInt(req.params.id, 10)));
    } catch (err) {
      return next(err);
    }
  }
);

// ── List tasks ─────────────────────────────────────────────────────────────
router.get(
  "/:id/portal/tasks",
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.listTasks(Number.parseInt(req.params.id, 10)));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Create task (admin) ────────────────────────────────────────────────────
router.post(
  "/:id/portal/tasks",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const { title, description, shift, startAt, endAt, maxHelpers } = req.body as {
        title?: string;
        description?: string;
        shift?: string;
        startAt?: string;
        endAt?: string;
        maxHelpers?: number | null;
      };
      if (!title || !shift) return next(new HttpError(400, "Titel en shift zijn verplicht"));
      if (!Object.values(Shift).includes(shift as Shift))
        return next(new HttpError(400, "Ongeldige shift"));

      const full = await service.createTask(eventId, {
        title,
        description,
        shift: shift as Shift,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        maxHelpers: maxHelpers ?? null,
      });
      return res.status(201).json(full);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Update task (admin) ────────────────────────────────────────────────────
router.patch(
  "/:id/portal/tasks/:taskId",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalTaskParamsSchema }),
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      const { title, description, shift, startAt, endAt, status, maxHelpers } =
        req.body as Record<string, string | number | null | undefined>;

      const data: TaskPatch = {};
      if (title !== undefined) data.title = title as string;
      if (description !== undefined) data.description = (description as string) || null;
      if (shift !== undefined) data.shift = shift as Shift;
      if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null;
      if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;
      if (status !== undefined) data.status = status as TaskStatus;
      if (maxHelpers !== undefined) data.maxHelpers = maxHelpers !== null ? Number(maxHelpers) : null;

      return res.json(await service.updateTask(taskId, eventId, data));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete task (admin) ────────────────────────────────────────────────────
router.delete(
  "/:id/portal/tasks/:taskId",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalTaskParamsSchema }),
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      await service.deleteTask(Number.parseInt(req.params.taskId, 10));
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Remove a specific assignee from a task (admin) ────────────────────────
router.delete(
  "/:id/portal/tasks/:taskId/assignees/:assigneeId",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalTaskAssigneeParamsSchema }),
  async (
    req: Request<{ id: string; taskId: string; assigneeId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const assigneeId = Number.parseInt(req.params.assigneeId, 10);
      const taskId = Number.parseInt(req.params.taskId, 10);
      const eventId = Number.parseInt(req.params.id, 10);
      return res.json(await service.removeTaskAssignee(assigneeId, taskId, eventId));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Claim task (auth or invite token) ─────────────────────────────────────
router.post(
  "/:id/portal/tasks/:taskId/claim",
  optionalAuth,
  validate({ params: portalTaskParamsSchema, query: portalClaimQuerySchema }),
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query as { token?: string };
      const { name, email } = req.body as { name?: string; email?: string };
      const userId: number | null = req.authUser?.id ?? null;

      if (!userId && token) {
        await service.validateInviteToken(token);
      } else if (!userId) {
        return next(new HttpError(401, "Authenticatie of uitnodigingslink vereist"));
      }

      if (!name?.trim()) return next(new HttpError(400, "Naam is verplicht"));

      await service.claimTask(Number.parseInt(req.params.taskId, 10), { userId, name, email });
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Unclaim task ───────────────────────────────────────────────────────────
router.post(
  "/:id/portal/tasks/:taskId/unclaim",
  requireAuth,
  validate({ params: portalTaskParamsSchema }),
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const userId = req.authUser?.id;
      if (userId) await service.unclaimTask(Number.parseInt(req.params.taskId, 10), userId);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Toggle done ────────────────────────────────────────────────────────────
router.post(
  "/:id/portal/tasks/:taskId/toggleDone",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalTaskParamsSchema }),
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      await service.toggleTaskDone(Number.parseInt(req.params.taskId, 10));
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Generate invite link (admin) ───────────────────────────────────────────
router.post(
  "/:id/portal/invite",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(
        await service.generateInviteLink(Number.parseInt(req.params.id, 10), req.authUser?.id)
      );
    } catch (err) {
      return next(err);
    }
  }
);

// ── List attendance (admin) ────────────────────────────────────────────────
router.get(
  "/:id/portal/attendance",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      return res.json(await service.listAttendance(Number.parseInt(req.params.id, 10)));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Import volunteers who helped this year into an event's attendance (admin) ─
router.post(
  "/:id/portal/import-volunteers",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalEventParamsSchema, query: portalYearQuerySchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const yearParam = req.query.year as string | undefined;
      const year = yearParam ? Number.parseInt(yearParam, 10) : undefined;
      return res.json(await service.importVolunteers(eventId, year));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Update attendance RSVP (admin) ─────────────────────────────────────────
router.patch(
  "/:id/portal/attendance/:aid",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalAttendanceParamsSchema }),
  async (req: Request<{ id: string; aid: string }>, res: Response, next: NextFunction) => {
    try {
      const id = Number.parseInt(req.params.aid, 10);
      const { status } = req.body as { status?: string };
      if (!status || !(Object.values(RSVPStatus) as string[]).includes(status)) {
        return next(new HttpError(400, "Ongeldige status"));
      }
      return res.json(await service.updateAttendanceRsvp(id, status as RSVPStatus));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete attendance (admin) ──────────────────────────────────────────────
router.delete(
  "/:id/portal/attendance/:aid",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalAttendanceParamsSchema }),
  async (req: Request<{ id: string; aid: string }>, res: Response, next: NextFunction) => {
    try {
      await service.deleteAttendance(Number.parseInt(req.params.aid, 10));
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── RSVP (public) ──────────────────────────────────────────────────────────
router.post(
  "/:id/portal/rsvp",
  optionalAuth,
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const { name, email, status } = req.body as { name: string; email?: string; status?: string };
      const userId: number | undefined = req.authUser?.id;

      if (!name) return next(new HttpError(400, "Naam is verplicht"));
      const statusEnum =
        status && (Object.values(RSVPStatus) as string[]).includes(status)
          ? (status as RSVPStatus)
          : undefined;
      await service.rsvp(eventId, { name, email, userId, status: statusEnum });
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Export CSV (admin) ─────────────────────────────────────────────────────
router.get(
  "/:id/portal/export",
  requireAuth,
  requireAccess("manageContent"),
  validate({ params: portalEventParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const csv = await service.exportAttendanceCsv(eventId);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=event-${eventId}-attendance.csv`);
      return res.send(csv);
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
