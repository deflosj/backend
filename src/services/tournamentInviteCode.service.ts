import crypto from "crypto";
import { TournamentInviteCode, UserRole } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import {
  createTournamentInviteCode,
  deleteTournamentInviteCode,
  findTournamentCodeByValue,
  listTournamentInviteCodes,
  markTournamentCodeUsed,
} from "../repositories/tournamentInviteCodeRepository";
import { createTeam, findTournamentById, TeamData } from "../repositories/tournamentRepository";
import { findUserById, updateUserRole } from "../repositories/userRepository";

const generateCode = (): string =>
  crypto.randomBytes(5).toString("hex").toUpperCase();

// ── Admin: manage codes ───────────────────────────────────────────────────────

export const createTournamentCode = async (
  tournamentId: number,
  label: string | undefined,
  createdById: number
): Promise<TournamentInviteCode> => {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) throw new HttpError(404, "Tournament not found");

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) throw new HttpError(500, "Could not generate a unique code");
  } while (await findTournamentCodeByValue(code));

  return createTournamentInviteCode({ tournamentId, code, label, createdById });
};

export const listTournamentCodes = async (
  tournamentId: number
): Promise<TournamentInviteCode[]> => {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) throw new HttpError(404, "Tournament not found");
  return listTournamentInviteCodes(tournamentId);
};

export const removeTournamentCode = async (
  codeId: number,
  tournamentId: number
): Promise<void> => {
  const codes = await listTournamentInviteCodes(tournamentId);
  const code = codes.find((c) => c.id === codeId);
  if (!code) throw new HttpError(404, "Invite code not found");
  if (code.isUsed) throw new HttpError(400, "Cannot delete a code that has already been used");
  return deleteTournamentInviteCode(codeId);
};

// ── Captain: redeem a code ────────────────────────────────────────────────────

export interface RedeemCodeInput {
  code: string;
  teamName: string;
  players: TeamData["players"];
  logoUrl?: string | null;
}

export const redeemTournamentCode = async (
  tournamentId: number,
  userId: number,
  input: RedeemCodeInput
) => {
  const record = await findTournamentCodeByValue(input.code.trim().toUpperCase());

  if (!record) throw new HttpError(400, "Invalid registration code");
  if (record.tournamentId !== tournamentId) throw new HttpError(400, "Code is not valid for this tournament");
  if (record.isUsed) throw new HttpError(400, "This registration code has already been used");

  if (!input.teamName?.trim()) throw new HttpError(400, "Team name is required");
  if (!Array.isArray(input.players) || input.players.length === 0) {
    throw new HttpError(400, "At least one player is required");
  }
  if (input.players.some((p) => !p.name?.trim())) {
    throw new HttpError(400, "All player names are required");
  }

  // Create the team with the redeeming user as captain
  const team = await createTeam(tournamentId, {
    name: input.teamName.trim(),
    logoUrl: input.logoUrl ?? null,
    pouleId: null,
    captainId: userId,
    players: input.players,
  });

  // Mark the code as used
  await markTournamentCodeUsed(record.id, team.id);

  // Promote user to CAPTAIN if they are currently a plain MEMBER
  const user = await findUserById(userId);
  if (user && user.role === UserRole.MEMBER) {
    await updateUserRole(userId, UserRole.CAPTAIN);
  }

  return team;
};
