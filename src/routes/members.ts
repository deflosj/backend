import { NextFunction, Request, Response, Router } from "express";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../utils/httpError";
import { getMember, listMembers, saveMyProfile } from "../services/memberService";

const membersRouter = Router();

interface MemberProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  bio?: string | null;
  joinedAt?: string | null;
  isPublic?: boolean;
}

membersRouter.get("/", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listMembers());
  } catch (error) {
    next(error);
  }
});

membersRouter.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getMember(Number.parseInt(req.params.id, 10)));
  } catch (error) {
    next(error);
  }
});

membersRouter.patch(
  "/me",
  requireAuth,
  async (req: Request<unknown, unknown, MemberProfileBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new HttpError(401, "Authorization token is required");
      }

      res.json(
        await saveMyProfile(req.authUser.id, {
          firstName: req.body.firstName ?? "",
          lastName: req.body.lastName ?? "",
          phone: req.body.phone,
          bio: req.body.bio,
          joinedAt: req.body.joinedAt ? new Date(req.body.joinedAt) : null,
          isPublic: req.body.isPublic,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default membersRouter;