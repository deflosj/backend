import prisma from "../database/prisma";

export interface HelperInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  eventIds: number[];
}

const include = {
  events: {
    select: { id: true, title: true, startsAt: true },
    orderBy: { startsAt: "desc" as const },
  },
};

export function findAllHelpers() {
  return prisma.helper.findMany({ include, orderBy: { name: "asc" } });
}

export function createHelper(data: HelperInput) {
  return prisma.helper.create({
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      note: data.note ?? null,
      events: { connect: data.eventIds.map((id) => ({ id })) },
    },
    include,
  });
}

export function updateHelper(id: number, data: Partial<HelperInput>) {
  return prisma.helper.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      note: data.note,
      // set vervangt de volledige lijst events
      events: data.eventIds ? { set: data.eventIds.map((eid) => ({ id: eid })) } : undefined,
    },
    include,
  });
}

export function deleteHelper(id: number) {
  return prisma.helper.delete({ where: { id } });
}
