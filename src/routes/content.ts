import { NextFunction, Request, Response, Router } from "express";
import { UserRole } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/authorizeRole";
import {
  createNewEvent,
  createNewSponsor,
  createNews,
  editEvent,
  editSponsor,
  editNews,
  getNewsPost,
  listEvents,
  listNewsPosts,
  listSponsors,
} from "../services/contentService";

const contentRouter = Router();

interface NewsPostBody {
  title?: string;
  slug?: string;
  body?: string;
  coverUrl?: string | null;
  isPublished?: boolean;
}

interface EventBody {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  isPublished?: boolean;
}

interface SponsorBody {
  name?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  tier?: "MAIN" | "GOLD" | "STANDARD";
  isActive?: boolean;
  sortOrder?: number;
}

contentRouter.get("/news", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listNewsPosts());
  } catch (error) {
    next(error);
  }
});

contentRouter.get("/news/:slug", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getNewsPost(req.params.slug));
  } catch (error) {
    next(error);
  }
});

contentRouter.post(
  "/news",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<unknown, unknown, NewsPostBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new HttpError(401, "Authorization token is required");
      }

      res.status(201).json(
        await createNews({
          authorId: req.authUser.id,
          title: req.body.title ?? "",
          slug: req.body.slug,
          body: req.body.body ?? "",
          coverUrl: req.body.coverUrl,
          isPublished: req.body.isPublished,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

contentRouter.patch(
  "/news/:id",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<{ id: string }, unknown, NewsPostBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(
        await editNews(Number.parseInt(req.params.id, 10), {
          title: req.body.title,
          slug: req.body.slug,
          body: req.body.body,
          coverUrl: req.body.coverUrl,
          isPublished: req.body.isPublished,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

contentRouter.get("/events", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listEvents());
  } catch (error) {
    next(error);
  }
});

contentRouter.post(
  "/events",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<unknown, unknown, EventBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new HttpError(401, "Authorization token is required");
      }

      res.status(201).json(
        await createNewEvent({
          createdById: req.authUser.id,
          title: req.body.title ?? "",
          description: req.body.description,
          location: req.body.location,
          startsAt: req.body.startsAt ?? "",
          endsAt: req.body.endsAt,
          isPublished: req.body.isPublished,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

contentRouter.patch(
  "/events/:id",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<{ id: string }, unknown, EventBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(
        await editEvent(Number.parseInt(req.params.id, 10), {
          title: req.body.title,
          description: req.body.description,
          location: req.body.location,
          startsAt: req.body.startsAt,
          endsAt: req.body.endsAt,
          isPublished: req.body.isPublished,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

contentRouter.get("/sponsors", async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listSponsors());
  } catch (error) {
    next(error);
  }
});

contentRouter.post(
  "/sponsors",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<unknown, unknown, SponsorBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json(
        await createNewSponsor({
          name: req.body.name ?? "",
          logoUrl: req.body.logoUrl,
          websiteUrl: req.body.websiteUrl,
          tier: req.body.tier,
          isActive: req.body.isActive,
          sortOrder: req.body.sortOrder,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

contentRouter.patch(
  "/sponsors/:id",
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request<{ id: string }, unknown, SponsorBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(
        await editSponsor(Number.parseInt(req.params.id, 10), {
          name: req.body.name,
          logoUrl: req.body.logoUrl,
          websiteUrl: req.body.websiteUrl,
          tier: req.body.tier,
          isActive: req.body.isActive,
          sortOrder: req.body.sortOrder,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default contentRouter;