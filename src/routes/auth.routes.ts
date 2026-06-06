import crypto from "node:crypto";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { HttpError } from "../utils/httpError";
import { validate } from "../utils/validate";
import { requireAuth } from "../middleware/auth";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  AuthResult,
  PublicUser,
} from "../services/auth.service";
import { validateCode } from "../services/registrationCode.service";
import config from "../config";

const authRouter = Router();
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const CSRF_COOKIE_NAME = "csrfToken";
const AUTH_COOKIE_PATH = `${config.apiPrefix}/auth`;
const AUTH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  secure: true,
  sameSite: "lax" as const,
  path: AUTH_COOKIE_PATH,
};
const refreshCookieOptions = {
  ...cookieOptions,
  httpOnly: true,
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
};
const csrfCookieOptions = {
  ...cookieOptions,
  httpOnly: false,
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
};

// Basic email: requires local-part @ domain . tld — rejects bare "name@" etc.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = z.object({
  email: z.string().regex(EMAIL_REGEX, { message: "Ongeldig e-mailadres" }),
  username: z.string().min(3, { message: "Gebruikersnaam moet minstens 3 tekens bevatten" }).max(50),
  password: z.string().min(8, { message: "Wachtwoord moet minstens 8 tekens lang zijn" }).max(128),
  inviteCode: z.string().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, { message: "Identifier is verplicht" }),
  password: z.string().min(1, { message: "Wachtwoord is verplicht" }),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Huidig wachtwoord is verplicht" }),
  newPassword: z.string().min(8, { message: "Nieuw wachtwoord moet minstens 8 tekens lang zijn" }).max(128),
});

const validateInviteParamsSchema = z.object({
  code: z.string().min(1, { message: "Invite code is verplicht" }),
});

type AuthResponse = Pick<AuthResult, "user" | "accessToken">;

const parseCookies = (cookieHeader: string | undefined): Record<string, string> =>
  (cookieHeader || "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});

const getRefreshTokenFromRequest = (req: Request): string | null => {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[REFRESH_TOKEN_COOKIE_NAME] || null;
};

const requireCsrfToken = (req: Request): void => {
  const cookies = parseCookies(req.headers.cookie);
  const csrfCookie = cookies[CSRF_COOKIE_NAME];
  const csrfHeader = req.header("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new HttpError(403, "Invalid CSRF token");
  }
};

const issueAuthCookies = (res: Response, refreshToken: string): void => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions);
  res.clearCookie(CSRF_COOKIE_NAME, cookieOptions);
};

const toAuthResponse = ({ user, accessToken }: AuthResult): AuthResponse => ({
  user,
  accessToken,
});

authRouter.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password, inviteCode } = req.body as z.infer<typeof registerSchema>;

      const requireInvite = config.nodeEnv !== "test";
      if (requireInvite && !inviteCode) {
        throw new HttpError(400, "Invite code is required");
      }

      const authResult = await registerUser({ email, username, password, inviteCode });
      issueAuthCookies(res, authResult.refreshToken);
      res.status(201).json(toAuthResponse(authResult));
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const { identifier, password } = req.body as z.infer<typeof loginSchema>;
      const authResult = await loginUser({ identifier, password });
      issueAuthCookies(res, authResult.refreshToken);
      res.json(toAuthResponse(authResult));
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/refresh",
  async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      requireCsrfToken(req);

      const refreshToken = getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        throw new HttpError(401, "Refresh token is required");
      }

      const authResult = await refreshTokens(refreshToken);
      issueAuthCookies(res, authResult.refreshToken);
      res.json(toAuthResponse(authResult));
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      requireCsrfToken(req);

      const refreshToken = getRefreshTokenFromRequest(req);

      if (refreshToken) {
        await logoutUser(refreshToken);
      }

      clearAuthCookies(res);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

authRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response<PublicUser>, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new HttpError(401, "Authorization token is required");
      }
      res.json(await getCurrentUser(req.authUser.id));
    } catch (error) {
      next(error);
    }
  }
);

authRouter.get(
  "/validate-invite/:code",
  validate({ params: validateInviteParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await validateCode(req.params.code);
      res.json({ valid: true, role: record.role });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.patch(
  "/password",
  requireAuth,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new HttpError(401, "Authorization token is required");
      }
      const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
      await changePassword(req.authUser.id, currentPassword, newPassword);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default authRouter;
