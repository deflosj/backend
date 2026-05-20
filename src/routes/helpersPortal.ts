import express, { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { RSVPStatus, TaskStatus, Shift } from "@prisma/client";
import * as repo from "../repositories/helpersRepository";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ── Public invite token lookup ─────────────────────────────────────────────
// GET /events/portal/invite/:token
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
// GET /events/:id/portal/stats
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
// GET /events/:id/portal/tasks
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
// POST /events/:id/portal/tasks
router.post(
  "/:id/portal/tasks",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const eventId = Number.parseInt(req.params.id, 10);
      const { title, description, shift, startAt, endAt, assignEmail, assignName } = req.body as {
        title?: string;
        description?: string;
        shift?: string;
        startAt?: string;
        endAt?: string;
        assignEmail?: string;
        assignName?: string;
      };
      if (!title || !shift) return res.status(400).json({ error: "Titel en shift zijn verplicht" });
      if (!Object.values(Shift).includes(shift as Shift))
        return res.status(400).json({ error: "Ongeldige shift" });

      const task = await repo.createTask(eventId, {
        title,
        description,
        shift: shift as Shift,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
      });

      if (assignEmail) {
        const user = await repo.findOrCreateUserByEmail(assignEmail, assignName);
        if (user) await repo.assignTask(task.id, user.id);
      }

      const full = await repo.listTasksByEvent(eventId);
      return res.status(201).json(full.find((t) => t.id === task.id) ?? task);
    } catch (err) {
      return next(err);
    }
  }
);

// ── Update task (admin) ────────────────────────────────────────────────────
// PATCH /events/:id/portal/tasks/:taskId
router.patch(
  "/:id/portal/tasks/:taskId",
  requireAuth,
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const { title, description, shift, startAt, endAt, assignEmail, assignName, status } =
        req.body as Record<string, string | undefined>;

      type TaskPatch = Parameters<typeof repo.updateTask>[1];
      const data: TaskPatch = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description || null;
      if (shift !== undefined) data.shift = shift as Shift;
      if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null;
      if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;
      if (status !== undefined) data.status = status as TaskStatus;

      if (assignEmail !== undefined) {
        if (assignEmail) {
          const user = await repo.findOrCreateUserByEmail(assignEmail, assignName);
          data.assignedToId = user?.id ?? null;
        } else {
          data.assignedToId = null;
        }
      }

      await repo.updateTask(taskId, data);

      const eventId = Number.parseInt(req.params.id, 10);
      const full = await repo.listTasksByEvent(eventId);
      return res.json(full.find((t) => t.id === taskId));
    } catch (err) {
      return next(err);
    }
  }
);

// ── Delete task (admin) ────────────────────────────────────────────────────
// DELETE /events/:id/portal/tasks/:taskId
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

// ── Claim task (auth or invite token) ─────────────────────────────────────
// POST /events/:id/portal/tasks/:taskId/claim
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
        const user = await repo.findOrCreateUserByEmail(email ?? "", name);
        userId = user?.id ?? null;
      }

      if (!userId) return res.status(401).json({ error: "Authenticatie of uitnodigingslink vereist" });

      const taskId = Number.parseInt(req.params.taskId, 10);
      const task = await repo.findTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Taak niet gevonden" });

      await repo.assignTask(taskId, userId);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Unclaim task ───────────────────────────────────────────────────────────
// POST /events/:id/portal/tasks/:taskId/unclaim
router.post(
  "/:id/portal/tasks/:taskId/unclaim",
  requireAuth,
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const task = await repo.findTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Taak niet gevonden" });
      if (task.assignedToId && req.authUser && task.assignedToId !== req.authUser.id) {
        return res.status(403).json({ error: "Niet toegestaan" });
      }
      await repo.assignTask(taskId, null);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Toggle done ────────────────────────────────────────────────────────────
// POST /events/:id/portal/tasks/:taskId/toggleDone
router.post(
  "/:id/portal/tasks/:taskId/toggleDone",
  requireAuth,
  async (req: Request<{ id: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const taskId = Number.parseInt(req.params.taskId, 10);
      const task = await repo.findTaskById(taskId);
      if (!task) return res.status(404).json({ error: "Taak niet gevonden" });
      if (task.assignedToId && req.authUser && task.assignedToId !== req.authUser.id) {
        return res.status(403).json({ error: "Niet toegestaan" });
      }
      const newStatus: TaskStatus = task.status === TaskStatus.DONE ? TaskStatus.OPEN : TaskStatus.DONE;
      await repo.updateTaskStatus(taskId, newStatus);
      return res.json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
);

// ── Generate invite link (admin) ───────────────────────────────────────────
// POST /events/:id/portal/invite
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
// GET /events/:id/portal/attendance
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
// PATCH /events/:id/portal/attendance/:aid
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
// DELETE /events/:id/portal/attendance/:aid
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
// POST /events/:id/portal/rsvp
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
// GET /events/:id/portal/export
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
