import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { Gender, RaceCategory } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../utils/httpError";
import { validate } from "../utils/validate";
import { requireAccess } from "../middleware/authorizeRole";
import {
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  changeRaceCategory,
  deleteRegistration,
  fetchRegistrationSettings,
  saveRegistrationSettings,
  submitRegistration,
} from "../services/registration.service";

const registrationsRouter = Router();

// Belgian national register number: raw 11 digits or formatted YY.MM.DD-XXX.CC
const RRNN_REGEX = /^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$|^\d{11}$/;
// Belgian/international phone: optional +, digits/spaces/hyphens/parens, 7–20 chars
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;
// Basic email: requires local-part @ domain . tld — rejects bare "name@" etc.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_VALUES = Object.values(Gender) as [Gender, ...Gender[]];
const RACE_CATEGORY_VALUES = Object.values(RaceCategory) as [RaceCategory, ...RaceCategory[]];

const registrationParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid registration id" }),
});

const submitRegistrationSchema = z.object({
  firstName: z.string().min(1, { message: "Voornaam is verplicht" }).max(100),
  lastName: z.string().min(1, { message: "Achternaam is verplicht" }).max(100),
  dateOfBirth: z.string().optional(),
  gender: z.enum(GENDER_VALUES),
  address: z.string().min(1, { message: "Adres is verplicht" }).max(500),
  nationalRegisterNumber: z
    .string()
    .regex(RRNN_REGEX, { message: "Ongeldig rijksregisternummer (gebruik YY.MM.DD-XXX.CC of 11 cijfers)" }),
  email: z.string().regex(EMAIL_REGEX, { message: "Ongeldig e-mailadres" }),
  phone: z.string().regex(PHONE_REGEX, { message: "Ongeldig telefoonnummer" }),
  wielerclub: z.string().max(200).optional(),
  raceCategory: z.enum(RACE_CATEGORY_VALUES),
});

registrationsRouter.post(
  "/",
  validate(submitRegistrationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as z.infer<typeof submitRegistrationSchema>;
      res.status(201).json(await submitRegistration(data));
    } catch (error) {
      next(error);
    }
  }
);

registrationsRouter.get(
  "/",
  requireAuth,
  requireAccess("manageRegistrations"),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await getAllRegistrations());
    } catch (error) {
      next(error);
    }
  }
);

// /settings must be defined before /:id routes so Express doesn't match "settings" as an id
registrationsRouter.get(
  "/settings",
  requireAuth,
  requireAccess("manageRegistrations"),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await fetchRegistrationSettings());
    } catch (error) {
      next(error);
    }
  }
);

registrationsRouter.patch(
  "/settings",
  requireAuth,
  requireAccess("manageRegistrations"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isOpen, dorpelingenkoersLimit, funWedstrijdLimit } = req.body as {
        isOpen?: boolean;
        dorpelingenkoersLimit?: number | null;
        funWedstrijdLimit?: number | null;
      };
      res.json(await saveRegistrationSettings({ isOpen, dorpelingenkoersLimit, funWedstrijdLimit }));
    } catch (error) {
      next(error);
    }
  }
);

registrationsRouter.patch(
  "/:id/approve",
  requireAuth,
  requireAccess("manageRegistrations"),
  validate({ params: registrationParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await approveRegistration(Number.parseInt(req.params.id, 10)));
    } catch (error) {
      next(error);
    }
  }
);

registrationsRouter.patch(
  "/:id/reject",
  requireAuth,
  requireAccess("manageRegistrations"),
  validate({ params: registrationParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await rejectRegistration(Number.parseInt(req.params.id, 10)));
    } catch (error) {
      next(error);
    }
  }
);

registrationsRouter.patch(
  "/:id/category",
  requireAuth,
  requireAccess("manageRegistrations"),
  validate({ params: registrationParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { raceCategory } = req.body as { raceCategory: RaceCategory };
      if (!Object.values(RaceCategory).includes(raceCategory)) {
        next(new HttpError(400, "Invalid raceCategory"));
        return;
      }
      res.json(await changeRaceCategory(Number.parseInt(req.params.id, 10), raceCategory));
    } catch (error) {
      next(error);
    }
  }
);

registrationsRouter.delete(
  "/:id",
  requireAuth,
  requireAccess("manageRegistrations"),
  validate({ params: registrationParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await deleteRegistration(Number.parseInt(req.params.id, 10));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default registrationsRouter;
