import express, { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { RSVPStatus, TaskStatus, Shift } from "@prisma/client";
import * as repo from "../repositories/helpersRepository";
import { v4 as uuidv4 } from "uuid";
 
const router = express.Router();

// ── Public invite token lookup ─────────────────────────────────────────────
router.get(
  "/portal/invite/:token",
  async (req: Request<{ token: string }>, res: Response, next: NextFunction) => {
    try {
      const invite = await repo.findInviteToken(req.params.token);
      if (!invite) return res.status(404).json({ error: "Ongeldige of verlopen uitnodigingslink" });
      const tasks = await repo.listTasksByEvent(invite.eventId);
      return res.json({ event: invite.event, tasks });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Task stats ─────────────────────────────────────────────────────────────
router.get(
  "/:id/portal/stats",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const stats = await repo.getEventTaskStats(eventId);
      return res.json(stats);
    } catch (err) {
      return next(err);
    }
  }
);

// ── List tasks ─────────────────────────────────────────────────────────────
router.get(
  "/:id/portal/tasks",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const tasks = await repo.listTasksByEvent(eventId);
      return res.json(tasks);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Create task (admin) ────────────────────────────────────────────────────
router.post(
  "/:id/portal/tasks",
  requireAuth,
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
      if (!title || !shift) return res.status(400).json({ error: "Titel en shift zijn verplicht" });
      if (!Object.values(Shift).includes(shift as Shift))
        return res.status(400).json({ error: "Ongeldige shift" });

      await repo.createTask(eventId, {
        title,
        description,
        shift: shift as Shift,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        maxHelpers: maxHelpers ?? null,
      });

      const full = await repo.listTasksByEvent(eventId);
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
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const { title, description, shift, startAt, endAt, status, maxHelpers } =
        req.body as Record<string, string | number | null | undefined>;

      type TaskPatch = Parameters<typeof repo.updateTask>[1];
      const data: TaskPatch = {};
      if (title !== undefined) data.title = title as string;
      if (description !== undefined) data.description = (description as string) || null;
      if (shift !== undefined) data.shift = shift as Shift;
      if (startAt !== undefined) data.startAt = startAt ? new Date(startAt as string) : null;
      if (endAt !== undefined) data.endAt = endAt ? new Date(endAt as string) : null;
      if (status !== undefined) data.status = status as TaskStatus;
      if (maxHelpers !== undefined) data.maxHelpers = maxHelpers !== null ? Number(maxHelpers) : null;

      await repo.updateTask(taskId, data); 

      const eventId = Number.parseInt(req.params.id, 10);
      const full = await repo.listTasksByEvent(eventId);
      return res.json(full);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete task (admin) ────────────────────────────────────────────────────
router.delete(
  "/:id/portal/tasks/:taskId",
  requireAuth,
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      await repo.deleteTask(taskId);
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
  async (req: Request<{ id: string; taskId: string; assigneeId: string }>, res: Response, next: NextFunction) => {
    try {
      const assigneeId = Number.parseInt(req.params.assigneeId, 10);
      await repo.removeTaskAssigneeById(assigneeId);
      const eventId = Number.parseInt(req.params.id, 10);
      const full = await repo.listTasksByEvent(eventId);
      return res.json(full);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Claim task (auth or invite token) ─────────────────────────────────────
router.post(
  "/:id/portal/tasks/:taskId/claim",
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query as { token?: string };
      const { name, email } = req.body as { name?: string; email?: string };
      let userId: number | null = null;

      if (req.headers.authorization) {
        try {
          requireAuth(req as any, res as any, (e?: unknown) => { if (e) throw e; });
          userId = req.authUser?.id ?? null;
        } catch { userId = null; }
      }

      if (!userId && token) {
        const invite = await repo.findInviteToken(token);
        if (!invite) return res.status(401).json({ error: "Ongeldige uitnodigingslink" });
      } else if (!userId) {
        return res.status(401).json({ error: "Authenticatie of uitnodigingslink vereist" });
      }

      if (!name?.trim()) return res.status(400).json({ error: "Naam is verplicht" });

      const taskId = Number.parseInt(req.params.taskId, 10);
      const task = await repo.findTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Taak niet gevonden" });

      // Check capacity
      if (task.maxHelpers !== null) {
        const count = await repo.countTaskAssignees(taskId);
        if (count >= task.maxHelpers) {
          return res.status(409).json({ error: "Deze shift is al vol" });
        }
      }

      // Resolve user by email if provided
      let resolvedUserId = userId;
      if (!resolvedUserId && email) {
        const user = await repo.findOrCreateUserByEmail(email, name);
        resolvedUserId = user?.id ?? null;
      }

      await repo.addTaskAssignee(taskId, {
        userId: resolvedUserId,
        name: name.trim(),
        email: email?.trim() || undefined,
      });

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
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const userId = req.authUser?.id;
      if (userId) await repo.removeTaskAssigneeByUser(taskId, userId);
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
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const task = await repo.findTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Taak niet gevonden" });
      const newStatus: TaskStatus = task.status === TaskStatus.DONE ? TaskStatus.OPEN : TaskStatus.DONE;
      await repo.updateTaskStatus(taskId, newStatus);
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
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const token = uuidv4();
      await repo.createInviteToken(eventId, token, req.authUser?.id);
      return res.json({ token });
    } catch (err) {
      return next(err);
    }
  }
);

// ── List attendance (admin) ────────────────────────────────────────────────
router.get(
  "/:id/portal/attendance",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const rows = await repo.listAttendance(eventId);
      return res.json(rows);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Update attendance RSVP (admin) ─────────────────────────────────────────
router.patch(
  "/:id/portal/attendance/:aid",
  requireAuth,
  async (req: Request<{ id: string; aid: string }>, res: Response, next: NextFunction) => {
    try {
      const id = Number.parseInt(req.params.aid, 10);
      const { status } = req.body as { status?: string };
      if (!status || !(Object.values(RSVPStatus) as string[]).includes(status)) {
        return res.status(400).json({ error: "Ongeldige status" });
      }
      const updated = await repo.updateAttendanceRsvp(id, status as RSVPStatus);
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete attendance (admin) ──────────────────────────────────────────────
router.delete(
  "/:id/portal/attendance/:aid",
  requireAuth,
  async (req: Request<{ id: string; aid: string }>, res: Response, next: NextFunction) => {
    try {
      const id = Number.parseInt(req.params.aid, 10);
      await repo.deleteAttendance(id);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── RSVP (public) ──────────────────────────────────────────────────────────
router.post(
  "/:id/portal/rsvp",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const { name, email, status } = req.body as { name: string; email?: string; status?: string };
      let userId: number | undefined;

      if (req.headers.authorization) {
        try {
          requireAuth(req as any, res as any, (e?: unknown) => { if (e) throw e; });
          userId = req.authUser?.id;
        } catch { userId = undefined; }
      }

      if (!name) return res.status(400).json({ error: "Naam is verplicht" });
      const statusEnum =
        status && (Object.values(RSVPStatus) as string[]).includes(status)
          ? (status as RSVPStatus)
          : undefined;
      await repo.createAttendance(eventId, { name, email, userId, status: statusEnum });
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
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const csv = await repo.exportAttendanceCsv(eventId);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=event-${eventId}-attendance.csv`);
      return res.send(csv);
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
