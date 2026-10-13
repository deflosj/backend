import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { validate } from "../utils/validate";
import * as repo from "../repositories/eventHelperRepository";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null));

const helperBodySchema = z.object({
  name: z.string().trim().min(1, "Naam is verplicht").max(120),
  email: optionalText,
  phone: optionalText,
  note: optionalText,
  eventIds: z.array(z.coerce.number().int().positive()).default([]),
});

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Ongeldig id" }),
});

const router = express.Router();

router.use(requireAuth, requireAccess("manageContent"));

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await repo.findAllHelpers());
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  validate({ body: helperBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await repo.createHelper(req.body as z.infer<typeof helperBodySchema>));
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  validate({ params: idParamsSchema, body: helperBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await repo.updateHelper(Number(req.params.id), req.body as z.infer<typeof helperBodySchema>));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await repo.deleteHelper(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
