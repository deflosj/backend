import crypto from "crypto";
import { RegistrationCode, UserRole } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import {
  findCodeByValue,
  createRegistrationCode,
  listRegistrationCodes,
  toggleRegistrationCode,
  incrementUsedCount,
  deleteRegistrationCode,
} from "../repositories/registrationCodeRepository";

const generateCode = (): string =>
  crypto.randomBytes(5).toString("hex").toUpperCase(); // e.g. "A3F9D21B7C"

export const validateCode = async (code: string): Promise<RegistrationCode> => {
  const record = await findCodeByValue(code.trim().toUpperCase());

  if (!record) {
    throw new HttpError(400, "Ongeldige uitnodigingscode");
  }

  if (!record.isActive) {
    throw new HttpError(400, "Deze uitnodigingscode is niet meer actief");
  }

  return record;
};

export const consumeCode = async (id: number): Promise<void> => {
  await incrementUsedCount(id);
};

export const createInviteCode = async (
  role: UserRole,
  label: string | undefined,
  createdById: number
): Promise<RegistrationCode> => {
  let code: string;
  let attempts = 0;

  // Retry on collision (extremely rare with 10-hex-char codes)
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) throw new HttpError(500, "Kon geen unieke code aanmaken");
  } while (await findCodeByValue(code));

  return createRegistrationCode({ code, role, label, createdById });
};

export const listInviteCodes = async (): Promise<RegistrationCode[]> => {
  return listRegistrationCodes();
};

export const toggleInviteCode = async (id: number): Promise<RegistrationCode> => {
  return toggleRegistrationCode(id);
};

export const removeInviteCode = async (id: number): Promise<void> => {
  return deleteRegistrationCode(id);
};
