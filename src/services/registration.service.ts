import { RaceCategory, Registration, RegistrationSettings, RegistrationStatus } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import {
  listRegistrations,
  updateRegistrationStatus,
  updateRaceCategory,
  removeRegistration,
  getRegistrationSettings,
  updateRegistrationSettings,
  createRegistration,
  countActiveRegistrationsByCategory,
  type CreateRegistrationInput,
} from "../repositories/registrationRepository";

export const getAllRegistrations = async (): Promise<Registration[]> => listRegistrations();

export const approveRegistration = async (id: number): Promise<Registration> =>
  updateRegistrationStatus(id, RegistrationStatus.APPROVED);

export const rejectRegistration = async (id: number): Promise<Registration> =>
  updateRegistrationStatus(id, RegistrationStatus.REJECTED);

export const changeRaceCategory = async (id: number, raceCategory: RaceCategory): Promise<Registration> =>
  updateRaceCategory(id, raceCategory);

export const deleteRegistration = async (id: number): Promise<void> => removeRegistration(id);

export const submitRegistration = async (input: CreateRegistrationInput): Promise<Registration> => {
  const settings = await getRegistrationSettings();
  if (!settings.isOpen) throw new HttpError(400, "Registrations are currently closed");

  const limit =
    input.raceCategory === "DORPELINGENKOERS" ? settings.dorpelingenkoersLimit : settings.funWedstrijdLimit;
  if (limit !== null && limit !== undefined) {
    const count = await countActiveRegistrationsByCategory(input.raceCategory);
    if (count >= limit) throw new HttpError(400, "Registration limit reached for this category");
  }

  return createRegistration(input);
};

export const fetchRegistrationSettings = async (): Promise<RegistrationSettings> => getRegistrationSettings();

export const saveRegistrationSettings = async (input: {
  isOpen?: boolean;
  dorpelingenkoersLimit?: number | null;
  funWedstrijdLimit?: number | null;
}): Promise<RegistrationSettings> => updateRegistrationSettings(input);
