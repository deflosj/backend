import { RefreshToken, User } from "@prisma/client";
import prisma from "../database/prisma";

export type RefreshTokenWithUser = RefreshToken & { user: User };

export const createRefreshToken = (
  userId: number,
  hashedToken: string,
  expiresAt: Date
): Promise<RefreshToken> =>
  prisma.refreshToken.create({ data: { userId, token: hashedToken, expiresAt } });

export const findRefreshTokenByHash = (
  hashedToken: string
): Promise<RefreshTokenWithUser | null> =>
  prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

export const deleteRefreshTokenByHash = (hashedToken: string): Promise<{ count: number }> =>
  prisma.refreshToken.deleteMany({ where: { token: hashedToken } });

export const deleteAllUserRefreshTokens = (userId: number): Promise<{ count: number }> =>
  prisma.refreshToken.deleteMany({ where: { userId } });
