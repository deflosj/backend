import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { HttpError } from "../utils/httpError";
import { UserRole } from "@prisma/client";

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

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) {
    next(new HttpError(401, "Authorization token is required"));
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
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