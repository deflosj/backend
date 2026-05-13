import { NextFunction, Request, Response, Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/authorizeRole";
import { archiveMessage, listMessages, readMessage, submitContactMessage } from "../services/contactService";

const contactRouter = Router();

interface ContactBody {
  name?: string;
  email?: string;
  subject?: string | null;
  body?: string;
}

contactRouter.post(
  "/messages",
  async (req: Request<unknown, unknown, ContactBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json(
        await submitContactMessage({
          name: req.body.name ?? "",
          email: req.body.email ?? "",
          subject: req.body.subject,
          body: req.body.body ?? "",
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

contactRouter.get(
  "/messages",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await listMessages());
    } catch (error) {
      next(error);
    }
  }
);

contactRouter.patch(
  "/messages/:id/read",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await readMessage(Number.parseInt(req.params.id, 10)));
    } catch (error) {
      next(error);
    }
  }
);

contactRouter.patch(
  "/messages/:id/archive",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await archiveMessage(Number.parseInt(req.params.id, 10)));
    } catch (error) {
      next(error);
    }
  }
);

export default contactRouter;