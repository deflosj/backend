import prisma from "../database/prisma";
import { TaskStatus, RSVPStatus, Shift } from "@prisma/client";

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, username: true, email: true } },
  assignees: { select: { id: true, name: true, email: true, userId: true }, orderBy: { createdAt: "asc" as const } },
};

export const listTasksByEvent = async (eventId: number) =>
  prisma.task.findMany({
    where: { eventId },
    include: TASK_INCLUDE,
    orderBy: { startAt: "asc" },
  });

export const findTaskById = async (id: number) =>
  prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });

export const createTask = async (
  eventId: number,
  data: { title: string; description?: string; shift: Shift; startAt?: Date; endAt?: Date; maxHelpers?: number | null }
) => prisma.task.create({ data: { eventId, status: TaskStatus.OPEN, ...data } });

export const updateTask = async (
  taskId: number,
  data: Partial<{
    title: string;
    description: string | null;
    shift: Shift;
    startAt: Date | null;
    endAt: Date | null;
    assignedToId: number | null;
    status: TaskStatus;
    maxHelpers: number | null;
  }>
) => prisma.task.update({ where: { id: taskId }, data });

export const deleteTask = async (taskId: number) => prisma.task.delete({ where: { id: taskId } });

export const assignTask = async (taskId: number, userId: number | null) =>
  prisma.task.update({ where: { id: taskId }, data: { assignedToId: userId } });

export const updateTaskStatus = async (taskId: number, status: TaskStatus) =>
  prisma.task.update({ where: { id: taskId }, data: { status } });

// ── TaskAssignee helpers ───────────────────────────────────────────────────────

export const countTaskAssignees = async (taskId: number) =>
  prisma.taskAssignee.count({ where: { taskId } });

export const addTaskAssignee = async (
  taskId: number,
  data: { userId?: number | null; name: string; email?: string }
) =>
  prisma.taskAssignee.upsert({
    where: { taskId_email: { taskId, email: data.email ?? "" } },
    create: { taskId, ...data },
    update: { name: data.name, userId: data.userId ?? null },
  });

export const removeTaskAssigneeByUser = async (taskId: number, userId: number) =>
  prisma.taskAssignee.deleteMany({ where: { taskId, userId } });

export const removeTaskAssigneeByEmail = async (taskId: number, email: string) =>
  prisma.taskAssignee.deleteMany({ where: { taskId, email } });

export const removeTaskAssigneeById = async (assigneeId: number) =>
  prisma.taskAssignee.delete({ where: { id: assigneeId } });

// ── Invite tokens ──────────────────────────────────────────────────────────────

export const createInviteToken = async (eventId: number, token: string, createdBy?: number) =>
  prisma.inviteToken.create({ data: { eventId, token, createdBy } });

export const findInviteToken = async (token: string) =>
  prisma.inviteToken.findUnique({ where: { token }, include: { event: true } });

// ── Attendance ─────────────────────────────────────────────────────────────────

export const createAttendance = async (
  eventId: number,
  data: { name: string; email?: string; userId?: number; status?: RSVPStatus }
) =>
  prisma.attendance.upsert({
    where: { eventId_email: { eventId, email: data.email ?? "" } },
    create: { eventId, name: data.name, email: data.email, userId: data.userId, status: data.status ?? RSVPStatus.NO_RESPONSE },
    update: { name: data.name, userId: data.userId, status: data.status ?? RSVPStatus.NO_RESPONSE },
  });

export const listAttendance = async (eventId: number) =>
  prisma.attendance.findMany({
    where: { eventId },
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

export const updateAttendanceRsvp = async (id: number, status: RSVPStatus) =>
  prisma.attendance.update({ where: { id }, data: { status } });

export const deleteAttendance = async (id: number) => prisma.attendance.delete({ where: { id } });

export const findOrCreateUserByEmail = async (email: string, name?: string) => {
  if (!email) return null;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const username = name ? name.replace(/\s+/g, "_").toLowerCase() : email.split("@")[0];
  return prisma.user.create({ data: { email, username, password: "", isActive: false } });
};

export const exportAttendanceCsv = async (eventId: number) => {
  const rows = await listAttendance(eventId);
  const header = ["name", "email", "status"].join(",");
  const lines = rows.map((r) => [r.name, r.email ?? "", r.status].join(","));
  return [header, ...lines].join("\n");
};

export const getEventTaskStats = async (eventId: number) => {
  const tasks = await prisma.task.findMany({
    where: { eventId },
    select: { shift: true, _count: { select: { assignees: true } } },
  });
  const shifts = [Shift.SETUP, Shift.DURING, Shift.BREAKDOWN] as const;
  const byShift = Object.fromEntries(
    shifts.map((shift) => {
      const st = tasks.filter((t) => t.shift === shift);
      const assigned = st.reduce((acc, t) => acc + t._count.assignees, 0);
      return [shift, { total: st.length, assigned }];
    })
  );
  return {
    total: tasks.length,
    assigned: tasks.reduce((acc, t) => acc + t._count.assignees, 0),
    byShift,
  };
};

export default {};
