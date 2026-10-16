import express, { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { requireAccess } from "../middleware/authorizeRole";
import { getMailStatus } from "../utils/mailer";

const router = express.Router();

/** Welke mailprovider actief is en, bij Resend, hoeveel er nog verstuurd mag worden. */
router.get("/status", requireAuth, requireAccess("manageContent"), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getMailStatus());
  } catch (err) {
    next(err);
  }
});

export default router;
