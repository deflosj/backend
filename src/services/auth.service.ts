import crypto from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { User, UserRole } from "@prisma/client";
import config from "../config";
import { HttpError } from "../utils/httpError";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameValues,
  findUserById,
  updateUserPassword,
  PublicUser,
} from "../repositories/userRepository";
import { validateCode, consumeCode } from "./registrationCode.service";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  deleteRefreshTokenByHash,
  deleteAllUserRefreshTokens,
} from "../repositories/refreshTokenRepository";

const REFRESH_TOKEN_BYTES = 40;
const REFRESH_TOKEN_DAYS = 30;
const passwordHashOptions = {
  type: argon2.argon2id,
};

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  inviteCode?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export type { PublicUser };

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const serializeUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createAccessToken = (user: User): string =>
  jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.accessTokenExpiry as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
    }
  );

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateAndStoreRefreshToken = async (userId: number): Promise<string> => {
  const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
  await createRefreshToken(userId, hashToken(rawToken), expiresAt);
  return rawToken;
};

export const registerUser = async ({ email, username, password, inviteCode }: RegisterInput): Promise<AuthResult> => {
  let role: UserRole = UserRole.MEMBER;
  let consumedCodeId: number | null = null;

  if (inviteCode) {
    const codeRecord = await validateCode(inviteCode);
    role = codeRecord.role;
    consumedCodeId = codeRecord.id;
  }

  const existingUser = await findUserByEmailOrUsernameValues(email, username);
  if (existingUser) {
    throw new HttpError(409, "A user with that email or username already exists");
  }

  const hashedPassword = await argon2.hash(password, passwordHashOptions);

  const createdUser = await createUser({
    email,
    username,
    password: hashedPassword,
    role,
  });

  if (consumedCodeId) await consumeCode(consumedCodeId);

  return {
    user: serializeUser(createdUser),
    accessToken: createAccessToken(createdUser),
    refreshToken: await generateAndStoreRefreshToken(createdUser.id),
  };
};

export const loginUser = async ({ identifier, password }: LoginInput): Promise<AuthResult> => {
  const user = await findUserByEmailOrUsername(identifier);

  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new HttpError(403, "User account is disabled");
  }

  const passwordMatches = await argon2.verify(user.password, password);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid credentials");
  }

  return {
    user: serializeUser(user),
    accessToken: createAccessToken(user),
    refreshToken: await generateAndStoreRefreshToken(user.id),
  };
};

export const refreshTokens = async (rawRefreshToken: string): Promise<AuthResult> => {
  const hashedToken = hashToken(rawRefreshToken);
  const tokenRecord = await findRefreshTokenByHash(hashedToken);

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    if (tokenRecord) await deleteRefreshTokenByHash(hashedToken);
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const { user } = tokenRecord;

  if (!user.isActive) {
    await deleteAllUserRefreshTokens(user.id);
    throw new HttpError(403, "User account is disabled");
  }

  // Rotate: invalidate old token before issuing new pair
  await deleteRefreshTokenByHash(hashedToken);

  return {
    user: serializeUser(user),
    accessToken: createAccessToken(user),
    refreshToken: await generateAndStoreRefreshToken(user.id),
  };
};

export const logoutUser = async (rawRefreshToken: string): Promise<void> => {
  await deleteRefreshTokenByHash(hashToken(rawRefreshToken));
};

export const getCurrentUser = async (userId: number): Promise<PublicUser> => {
  const user = await findUserById(userId);

  if (!user?.isActive) {
    throw new HttpError(404, "User not found");
  }

  return serializeUser(user);
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await findUserById(userId);

  if (!user?.isActive) {
    throw new HttpError(404, "User not found");
  }

  const passwordMatches = await argon2.verify(user.password, currentPassword);
  if (!passwordMatches) {
    throw new HttpError(400, "Huidig wachtwoord is onjuist");
  }

  const hashed = await argon2.hash(newPassword, passwordHashOptions);
  await updateUserPassword(userId, hashed);
  await deleteAllUserRefreshTokens(userId);
};
