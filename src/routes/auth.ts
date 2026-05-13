import { Router, Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { requireAuth } from "../middleware/auth";
import { getCurrentUser, loginUser, registerUser, AuthResult, PublicUser } from "../services/authService";

const authRouter = Router();

interface RegisterBody {
  email?: string;
  username?: string;
  password?: string;
}

interface LoginBody {
  identifier?: string;
  password?: string;
}

interface AuthResponse extends AuthResult {}

authRouter.post(
  "/register",
  async (req: Request<unknown, unknown, RegisterBody>, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const email = req.body.email?.trim();
      const username = req.body.username?.trim();
      const password = req.body.password;

      if (!email || !username || !password) {
        throw new HttpError(400, "Email, username, and password are required");
      }

      if (password.length < 8) {
        throw new HttpError(400, "Password must be at least 8 characters long");
      }

      const authResult = await registerUser({
        email,
        username,
        password,
      });

      res.status(201).json({
        user: authResult.user,
        token: authResult.token,
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/login",
  async (req: Request<unknown, unknown, LoginBody>, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.body.identifier?.trim();
      const password = req.body.password;

      if (!identifier || !password) {
        throw new HttpError(400, "Identifier and password are required");
      }

      const authResult = await loginUser({
        identifier,
        password,
      });

      res.json({
        user: authResult.user,
        token: authResult.token,
      });
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

      const user = await getCurrentUser(req.authUser.id);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default authRouter;