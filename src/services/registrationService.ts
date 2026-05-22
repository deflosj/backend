import { RaceCategory, Registration, RegistrationStatus } from "@prisma/client";
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

export const getAllRegistrations = async () => listRegistrations();

export const approveRegistration = async (id: number) =>
  updateRegistrationStatus(id, RegistrationStatus.APPROVED);

export const rejectRegistration = async (id: number) =>
  updateRegistrationStatus(id, RegistrationStatus.REJECTED);

export const changeRaceCategory = async (id: number, raceCategory: RaceCategory): Promise<Registration> =>
  updateRaceCategory(id, raceCategory);

export const deleteRegistration = async (id: number) => removeRegistration(id);

export const submitRegistration = async (input: CreateRegistrationInput): Promise<Registration> => {
  const settings = await getRegistrationSettings();
  if (!settings.isOpen) throw Object.assign(new Error("Registrations are currently closed"), { status: 400 });

  const limit =
    input.raceCategory === "DORPELINGENKOERS" ? settings.dorpelingenkoersLimit : settings.funWedstrijdLimit;
  if (limit !== null && limit !== undefined) {
    const count = await countActiveRegistrationsByCategory(input.raceCategory);
    if (count >= limit) throw Object.assign(new Error("Registration limit reached for this category"), { status: 400 });
  }

  return createRegistration(input);
};

export const fetchRegistrationSettings = async () => getRegistrationSettings();

export const saveRegistrationSettings = async (input: {
  isOpen?: boolean;
  dorpelingenkoersLimit?: number | null;
  funWedstrijdLimit?: number | null;
}) => updateRegistrationSettings(input);
