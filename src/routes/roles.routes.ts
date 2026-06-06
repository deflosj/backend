import { NextFunction, Request, Response, Router } from "express";
import { listRoleAccessEntries } from "../config/roleManager";
import { requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";

const rolesRouter = Router();

rolesRouter.get(
  "/",
  requireAuth,
  requireAccess("manageRoles"),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ access: listRoleAccessEntries() });
    } catch (error) {
      next(error);
    }
  }
);

export default rolesRouter;