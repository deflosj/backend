import { Registration, RegistrationSettings, RegistrationStatus } from "@prisma/client";
import prisma from "../database/prisma";

export const listRegistrations = async (): Promise<Registration[]> => {
  return prisma.registration.findMany({ orderBy: { timestamp: "desc" } });
};

export const updateRegistrationStatus = async (id: number, status: RegistrationStatus): Promise<Registration> => {
  return prisma.registration.update({ where: { id }, data: { status } });
};

export const removeRegistration = async (id: number): Promise<void> => {
  await prisma.registration.delete({ where: { id } });
};

export const getRegistrationSettings = async (): Promise<RegistrationSettings> => {
  const settings = await prisma.registrationSettings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return prisma.registrationSettings.create({ data: { id: 1 } });
};

export const updateRegistrationSettings = async (data: {
  isOpen?: boolean;
  dorpelingenkoersLimit?: number | null;
  funWedstrijdLimit?: number | null;
}): Promise<RegistrationSettings> => {
  return prisma.registrationSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
};
