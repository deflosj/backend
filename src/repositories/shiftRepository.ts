import prisma from "../database/prisma";

const SLOT_INCLUDE = {
  registrations: {
    select: { id: true, slotId: true, userId: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
};

const GROUP_INCLUDE = {
  slots: {
    include: SLOT_INCLUDE,
    orderBy: { startAt: "asc" as const },
  },
};

// ── Groups ────────────────────────────────────────────────────────────────────

export const listGroupsByEvent = (eventId: number) =>
  prisma.shiftGroup.findMany({
    where: { eventId },
    include: GROUP_INCLUDE,
    orderBy: { sortOrder: "asc" },
  });

export const findGroupById = (id: number) =>
  prisma.shiftGroup.findUnique({ where: { id }, include: GROUP_INCLUDE });

export const createGroup = (
  eventId: number,
  data: { name: string; description?: string | null; color?: string; icon?: string | null; sortOrder?: number }
) => prisma.shiftGroup.create({ data: { eventId, ...data } });

export const updateGroup = (
  id: number,
  data: Partial<{ name: string; description: string | null; color: string; icon: string | null; sortOrder: number }>
) => prisma.shiftGroup.update({ where: { id }, data });

export const deleteGroup = (id: number) => prisma.shiftGroup.delete({ where: { id } });

// ── Slots ─────────────────────────────────────────────────────────────────────

export const findSlotById = (id: number) =>
  prisma.shiftSlot.findUnique({ where: { id }, include: SLOT_INCLUDE });

export const createSlot = (
  groupId: number,
  data: {
    startAt: Date;
    endAt: Date;
    title?: string | null;
    maxPersons?: number | null;
    isUnlimited?: boolean;
    description?: string | null;
    location?: string | null;
    requiredRole?: string | null;
    notes?: string | null;
  }
) => prisma.shiftSlot.create({ data: { groupId, ...data } });

export const updateSlot = (
  id: number,
  data: Partial<{
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
  }>
) => prisma.shiftSlot.update({ where: { id }, data });

export const deleteSlot = (id: number) => prisma.shiftSlot.delete({ where: { id } });

// ── Registrations ─────────────────────────────────────────────────────────────

export const countSlotRegistrations = (slotId: number) =>
  prisma.shiftRegistration.count({ where: { slotId } });

export const findRegistrationsByEmail = (email: string, eventId: number) =>
  prisma.shiftRegistration.findMany({
    where: { email, slot: { group: { eventId } } },
    include: { slot: { select: { startAt: true, endAt: true, groupId: true } } },
  });

export const addRegistration = (
  slotId: number,
  data: { userId?: number | null; name: string; email?: string | null }
) =>
  prisma.shiftRegistration.upsert({
    where: { slotId_email: { slotId, email: data.email ?? "" } },
    create: { slotId, ...data },
    update: { name: data.name, userId: data.userId ?? null },
  });

export const removeRegistration = (id: number) =>
  prisma.shiftRegistration.delete({ where: { id } });

export const removeRegistrationByEmail = (slotId: number, email: string) =>
  prisma.shiftRegistration.deleteMany({ where: { slotId, email } });

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getEventShiftStats = async (eventId: number) => {
  const groups = await prisma.shiftGroup.findMany({
    where: { eventId },
    include: {
      slots: {
        select: { id: true, maxPersons: true, isUnlimited: true, _count: { select: { registrations: true } } },
      },
    },
  });
  let totalSpots = 0;
  let totalRegistrations = 0;
  let openSpots = 0;
  for (const g of groups) {
    for (const s of g.slots) {
      totalRegistrations += s._count.registrations;
      if (!s.isUnlimited && s.maxPersons !== null) {
        totalSpots += s.maxPersons;
        openSpots += Math.max(0, s.maxPersons - s._count.registrations);
      }
    }
  }
  return { totalGroups: groups.length, totalRegistrations, totalSpots, openSpots };
};

export default {};
