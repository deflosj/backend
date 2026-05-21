import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserRole } from "@prisma/client";
import config from "../config";
import { HttpError } from "../utils/httpError";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameValues,
  findUserById,
} from "../repositories/userRepository";
import { validateCode, consumeCode } from "./registrationCodeService";

const saltRounds = 10;

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  inviteCode: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface PublicUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

const serializeUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user: User): string =>
  jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiry as jwt.SignOptions["expiresIn"],
    }
  );

export const registerUser = async ({ email, username, password, inviteCode }: RegisterInput): Promise<AuthResult> => {
  const codeRecord = await validateCode(inviteCode);

  const existingUser = await findUserByEmailOrUsernameValues(email, username);
  if (existingUser) {
    throw new HttpError(409, "A user with that email or username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const createdUser = await createUser({
    email,
    username,
    password: hashedPassword,
    role: codeRecord.role,
  });

  await consumeCode(codeRecord.id);

  return {
    user: serializeUser(createdUser),
    token: createToken(createdUser),
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

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid credentials");
  }

  return {
    user: serializeUser(user),
    token: createToken(user),
  };
};

export const getCurrentUser = async (userId: number): Promise<PublicUser> => {
  const user = await findUserById(userId);

  if (!user || !user.isActive) {
    throw new HttpError(404, "User not found");
  }

  return serializeUser(user);
};
