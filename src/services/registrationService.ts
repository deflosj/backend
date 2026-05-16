import { RegistrationStatus } from "@prisma/client";
import {
  listRegistrations,
  updateRegistrationStatus,
  removeRegistration,
  getRegistrationSettings,
  updateRegistrationSettings,
} from "../repositories/registrationRepository";

export const getAllRegistrations = async () => listRegistrations();

export const approveRegistration = async (id: number) =>
  updateRegistrationStatus(id, RegistrationStatus.APPROVED);

export const rejectRegistration = async (id: number) =>
  updateRegistrationStatus(id, RegistrationStatus.REJECTED);

export const deleteRegistration = async (id: number) => removeRegistration(id);

export const fetchRegistrationSettings = async () => getRegistrationSettings();

export const saveRegistrationSettings = async (input: {
  isOpen?: boolean;
  dorpelingenkoersLimit?: number | null;
  funWedstrijdLimit?: number | null;
}) => updateRegistrationSettings(input);
