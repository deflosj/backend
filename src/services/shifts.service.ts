import { HttpError } from "../utils/httpError";
import * as repo from "../repositories/shiftRepository";
import * as helpersRepo from "../repositories/helpersRepository";
import { isInviteTokenExpired } from "./inviteTokenExpiry";

export interface RegisterForSlotInput {
  userId: number | null;
  name: string;
  email?: string;
}

export type GroupPatch = Partial<{
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
}>;

export type SlotPatch = Partial<{
  title: string | null;
  startAt: Date;
  endAt: Date;
  maxPersons: number | null;
  isUnlimited: boolean;
  description: string | null;
  location: string | null;
  requiredRole: string | null;
  isLocked: boolean;
  isClosed: boolean;
  notes: string | null;
}>;

export const validateInviteToken = async (token: string) => {
  const invite = await helpersRepo.findInviteToken(token);
  if (!invite || isInviteTokenExpired(invite.expiresAt)) {
    throw new HttpError(401, "Ongeldige uitnodigingslink");
  }
  return invite;
};

export const getInviteWithGroups = async (token: string) => {
  const invite = await helpersRepo.findInviteToken(token);
  if (!invite || isInviteTokenExpired(invite.expiresAt)) {
    throw new HttpError(404, "Ongeldige of verlopen uitnodigingslink");
  }
  const groups = await repo.listGroupsByEvent(invite.eventId);
  return { event: invite.event, groups };
};

export const listGroups = (eventId: number) => repo.listGroupsByEvent(eventId);

export const getShiftStats = (eventId: number) => repo.getEventShiftStats(eventId);

export const createGroup = async (
  eventId: number,
  data: Parameters<typeof repo.createGroup>[1]
) => {
  await repo.createGroup(eventId, data);
  return repo.listGroupsByEvent(eventId);
};

export const updateGroup = async (groupId: number, eventId: number, data: GroupPatch) => {
  await repo.updateGroup(groupId, data);
  return repo.listGroupsByEvent(eventId);
};

export const deleteGroup = async (groupId: number, eventId: number) => {
  await repo.deleteGroup(groupId);
  return repo.listGroupsByEvent(eventId);
};

export const createSlot = async (
  groupId: number,
  eventId: number,
  data: Parameters<typeof repo.createSlot>[1]
) => {
  await repo.createSlot(groupId, data);
  return repo.listGroupsByEvent(eventId);
};

export const updateSlot = async (slotId: number, eventId: number, data: SlotPatch) => {
  await repo.updateSlot(slotId, data);
  return repo.listGroupsByEvent(eventId);
};

export const deleteSlot = async (slotId: number, eventId: number) => {
  await repo.deleteSlot(slotId);
  return repo.listGroupsByEvent(eventId);
};

export const registerForSlot = async (
  slotId: number,
  eventId: number,
  data: RegisterForSlotInput
): Promise<void> => {
  const slot = await repo.findSlotById(slotId);
  if (!slot) throw new HttpError(404, "Shift-slot niet gevonden");
  if (slot.isClosed) throw new HttpError(409, "Registraties zijn gesloten");
  if (slot.isLocked) throw new HttpError(409, "Dit slot is vergrendeld");

  if (!slot.isUnlimited && slot.maxPersons !== null) {
    const count = await repo.countSlotRegistrations(slotId);
    if (count >= slot.maxPersons) throw new HttpError(409, "Dit slot is al vol");
  }

  if (data.email) {
    const existing = await repo.findRegistrationsByEmail(data.email, eventId);
    const slotStart = slot.startAt.getTime();
    const slotEnd = slot.endAt.getTime();
    const conflict = existing.find((r) => {
      const s = r.slot.startAt.getTime();
      const e = r.slot.endAt.getTime();
      return s < slotEnd && e > slotStart;
    });
    if (conflict) throw new HttpError(409, "Je hebt al een shift die overlaps met dit tijdslot");
  }

  await repo.addRegistration(slotId, {
    userId: data.userId,
    name: data.name.trim(),
    email: data.email?.trim() || null,
  });
};

export const removeRegistration = async (regId: number, eventId: number) => {
  await repo.removeRegistration(regId);
  return repo.listGroupsByEvent(eventId);
};

export const unregisterFromSlot = async (slotId: number, email: string) =>
  repo.removeRegistrationByEmail(slotId, email);
