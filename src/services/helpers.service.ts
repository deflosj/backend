import { RSVPStatus, TaskStatus, Shift } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { HttpError } from "../utils/httpError";
import * as repo from "../repositories/helpersRepository";
import { findOrCreateUserByEmail } from "../repositories/userRepository";
import { getInviteTokenExpiresAt, isInviteTokenExpired } from "./inviteTokenExpiry";

export interface CreateTaskInput {
  title: string;
  description?: string;
  shift: Shift;
  startAt?: Date;
  endAt?: Date;
  maxHelpers?: number | null;
}

export type TaskPatch = Partial<{
  title: string;
  description: string | null;
  shift: Shift;
  startAt: Date | null;
  endAt: Date | null;
  status: TaskStatus;
  maxHelpers: number | null;
}>;

export interface ClaimTaskInput {
  userId: number | null;
  name: string;
  email?: string;
}

export interface RsvpInput {
  name: string;
  email?: string;
  userId?: number;
  status?: RSVPStatus;
}

export const validateInviteToken = async (token: string) => {
  const invite = await repo.findInviteToken(token);
  if (!invite || isInviteTokenExpired(invite.expiresAt)) {
    throw new HttpError(401, "Ongeldige uitnodigingslink");
  }
  return invite;
};

export const getInviteWithTasks = async (token: string) => {
  const invite = await repo.findInviteToken(token);
  if (!invite || isInviteTokenExpired(invite.expiresAt)) {
    throw new HttpError(404, "Ongeldige of verlopen uitnodigingslink");
  }
  const tasks = await repo.listTasksByEvent(invite.eventId);
  return { event: invite.event, tasks };
};

export const getEventTaskStats = (eventId: number) => repo.getEventTaskStats(eventId);

export const listTasks = (eventId: number) => repo.listTasksByEvent(eventId);

export const createTask = async (eventId: number, data: CreateTaskInput) => {
  await repo.createTask(eventId, data);
  return repo.listTasksByEvent(eventId);
};

export const updateTask = async (taskId: number, eventId: number, data: TaskPatch) => {
  await repo.updateTask(taskId, data);
  return repo.listTasksByEvent(eventId);
};

export const deleteTask = (taskId: number) => repo.deleteTask(taskId);

export const removeTaskAssignee = async (assigneeId: number, taskId: number, eventId: number) => {
  const assignee = await repo.findTaskAssigneeById(assigneeId);
  if (assignee?.taskId !== taskId || assignee?.task?.eventId !== eventId) {
    throw new HttpError(404, "Taakassignee niet gevonden");
  }

  await repo.removeTaskAssigneeById(assigneeId);
  return repo.listTasksByEvent(eventId);
};

export const claimTask = async (taskId: number, claimData: ClaimTaskInput) => {
  const task = await repo.findTaskById(taskId);
  if (!task) throw new HttpError(404, "Taak niet gevonden");

  if (task.maxHelpers !== null) {
    const count = await repo.countTaskAssignees(taskId);
    if (count >= task.maxHelpers) throw new HttpError(409, "Deze shift is al vol");
  }

  let resolvedUserId = claimData.userId;
  if (!resolvedUserId && claimData.email) {
    const user = await findOrCreateUserByEmail(claimData.email, claimData.name);
    resolvedUserId = user?.id ?? null;
  }

  await repo.addTaskAssignee(taskId, {
    userId: resolvedUserId,
    name: claimData.name.trim(),
    email: claimData.email?.trim() || undefined,
  });
};

export const unclaimTask = (taskId: number, userId: number) =>
  repo.removeTaskAssigneeByUser(taskId, userId);

export const toggleTaskDone = async (taskId: number) => {
  const task = await repo.findTaskById(taskId);
  if (!task) throw new HttpError(404, "Taak niet gevonden");
  const newStatus = task.status === TaskStatus.DONE ? TaskStatus.OPEN : TaskStatus.DONE;
  await repo.updateTaskStatus(taskId, newStatus);
};

export const generateInviteLink = async (eventId: number, createdBy?: number) => {
  const token = uuidv4();
  const expiresAt = getInviteTokenExpiresAt();
  await repo.createInviteToken(eventId, token, createdBy, expiresAt);
  return { token };
};

export const listAttendance = (eventId: number) => repo.listAttendance(eventId);

export const importVolunteers = (eventId: number, year?: number) =>
  repo.importVolunteersForYear(eventId, year);

export const updateAttendanceRsvp = (id: number, status: RSVPStatus) =>
  repo.updateAttendanceRsvp(id, status);

export const deleteAttendance = (id: number) => repo.deleteAttendance(id);

export const rsvp = (eventId: number, data: RsvpInput) => repo.createAttendance(eventId, data);

export const exportAttendanceCsv = (eventId: number) => repo.exportAttendanceCsv(eventId);
