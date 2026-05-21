import { RegistrationCode, UserRole } from "@prisma/client";
import prisma from "../database/prisma";

export interface CreateRegistrationCodeInput {
  code: string;
  role: UserRole;
  label?: string;
  createdById?: number;
}

export const findCodeByValue = async (code: string): Promise<RegistrationCode | null> => {
  return prisma.registrationCode.findUnique({ where: { code } });
};

export const createRegistrationCode = async (
  data: CreateRegistrationCodeInput
): Promise<RegistrationCode> => {
  return prisma.registrationCode.create({ data });
};

export const listRegistrationCodes = async (): Promise<RegistrationCode[]> => {
  return prisma.registrationCode.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const toggleRegistrationCode = async (id: number): Promise<RegistrationCode> => {
  const current = await prisma.registrationCode.findUniqueOrThrow({ where: { id } });
  return prisma.registrationCode.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
};

export const incrementUsedCount = async (id: number): Promise<void> => {
  await prisma.registrationCode.update({
    where: { id },
    data: { usedCount: { increment: 1 } },
  });
};

export const deleteRegistrationCode = async (id: number): Promise<void> => {
  await prisma.registrationCode.delete({ where: { id } });
};
