import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../utils/httpError";
import { validate } from "../utils/validate";
import { getMember, listMembers, saveMyProfile, listAllUsers } from "../services/member.service";
import { requireAccess } from "../middleware/authorizeRole";

const membersRouter = Router();

// Belgian/international phone: optional +, digits/spaces/hyphens/parens, 7–20 chars
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

const memberParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid member id" }),
});

const memberProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().regex(PHONE_REGEX, { message: "Ongeldig telefoonnummer" }).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  joinedAt: z.iso.datetime({ message: "Ongeldige datum voor joinedAt" }).nullable().optional(),
  isPublic: z.boolean().optional(),
});

membersRouter.get("/", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listMembers());
  } catch (error) {
    next(error);
  }
});

// Admin: list all users (for leden overview)
membersRouter.get(
  "/all",
  requireAuth,
  requireAccess("manageMembers"),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await listAllUsers());
    } catch (error) {
      next(error);
    }
  }
);

membersRouter.get("/:id", validate({ params: memberParamsSchema }), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      throw new HttpError(400, "Invalid member id");
    }

    res.json(await getMember(id));
  } catch (error) {
    next(error);
  }
});

membersRouter.patch(
  "/me",
  requireAuth,
  validate(memberProfileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new HttpError(401, "Authorization token is required");
      }

      const body = req.body as z.infer<typeof memberProfileSchema>;
      res.json(
        await saveMyProfile(req.authUser.id, {
          firstName: body.firstName ?? "",
          lastName: body.lastName ?? "",
          phone: body.phone,
          bio: body.bio,
          joinedAt: body.joinedAt ? new Date(body.joinedAt) : null,
          isPublic: body.isPublic,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default membersRouter;