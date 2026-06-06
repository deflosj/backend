import { TournamentInviteCode } from "@prisma/client";
import prisma from "../database/prisma";

export interface CreateTournamentInviteCodeInput {
  tournamentId: number;
  code: string;
  label?: string;
  createdById?: number;
}

export const findTournamentCodeByValue = async (
  code: string
): Promise<TournamentInviteCode | null> => {
  return prisma.tournamentInviteCode.findUnique({ where: { code } });
};

export const createTournamentInviteCode = async (
  data: CreateTournamentInviteCodeInput
): Promise<TournamentInviteCode> => {
  return prisma.tournamentInviteCode.create({ data });
};

export const listTournamentInviteCodes = async (
  tournamentId: number
): Promise<TournamentInviteCode[]> => {
  return prisma.tournamentInviteCode.findMany({
    where: { tournamentId },
    orderBy: { createdAt: "desc" },
  });
};

export const markTournamentCodeUsed = async (
  id: number,
  usedByTeamId: number
): Promise<TournamentInviteCode> => {
  return prisma.tournamentInviteCode.update({
    where: { id },
    data: { isUsed: true, usedByTeamId },
  });
};

export const deleteTournamentInviteCode = async (id: number): Promise<void> => {
  await prisma.tournamentInviteCode.delete({ where: { id } });
};
