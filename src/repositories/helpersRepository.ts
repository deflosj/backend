import prisma from "../database/prisma";
import { TaskStatus, RSVPStatus, Shift } from "@prisma/client";

export const listTasksByEvent = async (eventId: number) =>
  prisma.task.findMany({
    where: { eventId },
    include: { assignedTo: { select: { id: true, username: true, email: true } } },
    orderBy: { startAt: "asc" },
  });

export const findTaskById = async (id: number) => prisma.task.findUnique({ where: { id } });

export const createTask = async (
  eventId: number,
  data: { title: string; description?: string; shift: Shift; startAt?: Date; endAt?: Date }
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
  }>
) => prisma.task.update({ where: { id: taskId }, data });

export const deleteTask = async (taskId: number) => prisma.task.delete({ where: { id: taskId } });

export const assignTask = async (taskId: number, userId: number | null) =>
  prisma.task.update({ where: { id: taskId }, data: { assignedToId: userId } });

export const updateTaskStatus = async (taskId: number, status: TaskStatus) =>
  prisma.task.update({ where: { id: taskId }, data: { status } });

export const createInviteToken = async (eventId: number, token: string, createdBy?: number) =>
  prisma.inviteToken.create({ data: { eventId, token, createdBy } });

export const findInviteToken = async (token: string) =>
  prisma.inviteToken.findUnique({ where: { token }, include: { event: true } });

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
    select: { shift: true, assignedToId: true },
  });
  const shifts = [Shift.SETUP, Shift.DURING, Shift.BREAKDOWN] as const;
  const byShift = Object.fromEntries(
    shifts.map((shift) => {
      const st = tasks.filter((t) => t.shift === shift);
      return [shift, { total: st.length, assigned: st.filter((t) => t.assignedToId !== null).length }];
    })
  );
  return {
    total: tasks.length,
    assigned: tasks.filter((t) => t.assignedToId !== null).length,
    byShift,
  };
};

export default {};
