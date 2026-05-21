import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { HttpError } from "../utils/httpError";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new HttpError(401, "Authorization token is required"));
      return;
    }

    console.log("Authenticated user role:", req.authUser.role);
    console.log("Allowed roles for this route:", allowedRoles);
    if (!allowedRoles.includes(req.authUser.role)) {
      next(new HttpError(403, "Insufficient permissions"));
      return;
    }

    next();
  };
};