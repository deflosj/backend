import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { HttpError } from "../utils/httpError";
import { UserRole } from "@prisma/client";

/**
 * Interface representing the expected payload of our JWT tokens. This extends the base JwtPayload
 * to include our custom fields: sub (user ID), email, username, and role.
 */
interface AuthTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
}

const parseBearerToken = (header: string | undefined): string | null => {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) { next(); return; }
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as AuthTokenPayload;
    const userId = Number.parseInt(payload.sub, 10);
    if (!Number.isNaN(userId)) {
      req.authUser = { id: userId, email: payload.email, username: payload.username, role: payload.role };
    }
  } catch { /* invalid token — treat as unauthenticated */ }
  next();
};


export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = parseBearerToken(req.headers.authorization);
  
  if (!token) {
    next(new HttpError(401, "Authorization token is required"));
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as AuthTokenPayload;
    const userId = Number.parseInt(payload.sub, 10);

    if (Number.isNaN(userId)) {
      next(new HttpError(401, "Invalid token payload"));
      return;
    }

    req.authUser = {
      id: userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};