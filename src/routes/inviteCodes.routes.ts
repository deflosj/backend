import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { HttpError } from "../utils/httpError";
import { validate } from "../utils/validate";
import {
  createInviteCode,
  listInviteCodes,
  toggleInviteCode,
  removeInviteCode,
} from "../services/registrationCode.service";

const inviteCodesRouter = Router();

const inviteCodeParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid id" }),
});

inviteCodesRouter.use(requireAuth, requireAccess("manageInviteCodes"));

inviteCodesRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const codes = await listInviteCodes();
      res.json(codes);
    } catch (error) {
      next(error);
    }
  }
);

interface CreateBody {
  role?: string;
  label?: string;
}

inviteCodesRouter.post(
  "/",
  async (req: Request<unknown, unknown, CreateBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role, label } = req.body;

      const validRoles = Object.values(UserRole);
      if (!role || !validRoles.includes(role as UserRole)) {
        throw new HttpError(400, `Role must be one of: ${validRoles.join(", ")}`);
      }

      const userId = req.authUser?.id;
      if (!userId) {
        throw new HttpError(401, "Unauthorized");
      }
      const code = await createInviteCode(role as UserRole, label, userId);
      res.status(201).json(code);
    } catch (error) {
      next(error);
    }
  }
);

inviteCodesRouter.patch(
  "/:id/toggle",
  validate({ params: inviteCodeParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(id)) throw new HttpError(400, "Invalid id");
      const updated = await toggleInviteCode(id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

inviteCodesRouter.delete(
  "/:id",
  validate({ params: inviteCodeParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(id)) throw new HttpError(400, "Invalid id");
      await removeInviteCode(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default inviteCodesRouter;
