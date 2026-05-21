import { NextFunction, Request, Response, Router } from "express";
import { RaceCategory, UserRole } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/authorizeRole";
import {
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  changeRaceCategory,
  deleteRegistration,
  fetchRegistrationSettings,
  saveRegistrationSettings,
} from "../services/registrationService";

const registrationsRouter = Router();

registrationsRouter.get(
  "/",
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
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
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
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
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
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
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
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
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
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
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { raceCategory } = req.body as { raceCategory: RaceCategory };
      if (!Object.values(RaceCategory).includes(raceCategory)) {
        res.status(400).json({ message: "Invalid raceCategory" });
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
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
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
