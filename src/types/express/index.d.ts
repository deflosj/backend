import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: number;
        email: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

export {};