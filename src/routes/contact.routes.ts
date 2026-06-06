import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { validate } from "../utils/validate";
import { archiveMessage, listMessages, readMessage, submitContactMessage } from "../services/contact.service";

const contactRouter = Router();

// Basic email: requires local-part @ domain . tld
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactMessageSchema = z.object({
  name: z.string().min(1, { message: "Naam is verplicht" }).max(200),
  email: z.string().regex(EMAIL_REGEX, { message: "Ongeldig e-mailadres" }),
  subject: z.string().max(300).nullable().optional(),
  body: z.string().min(1, { message: "Bericht is verplicht" }).max(5000),
});

const contactMessageParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid message id" }),
});

contactRouter.post(
  "/messages",
  validate(contactMessageSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, subject, body } = req.body as z.infer<typeof contactMessageSchema>;
      res.status(201).json(await submitContactMessage({ name, email, subject, body: body ?? "" }));
    } catch (error) {
      next(error);
    }
  }
);

contactRouter.get(
  "/messages",
  requireAuth,
  requireAccess("manageContactInbox"),
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
  requireAccess("manageContactInbox"),
  validate({ params: contactMessageParamsSchema }),
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
  requireAccess("manageContactInbox"),
  validate({ params: contactMessageParamsSchema }),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await archiveMessage(Number.parseInt(req.params.id, 10)));
    } catch (error) {
      next(error);
    }
  }
);

export default contactRouter;