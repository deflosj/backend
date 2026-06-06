import { User, UserRole } from "@prisma/client";
import prisma from "../database/prisma";

export interface PublicUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeUsername = (username: string): string => username.trim();

export const findUserByEmailOrUsername = async (identifier: string): Promise<User | null> => {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizeEmail(identifier) },
        { username: normalizeUsername(identifier) },
      ],
    },
  });
};

export const findUserById = async (userId: number): Promise<User | null> => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
};

export const findUserByEmailOrUsernameValues = async (
  email: string,
  username: string
): Promise<User | null> => {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: normalizeEmail(email) }, { username: normalizeUsername(username) }],
    },
  });
};

export const createUser = async ({ email, username, password, role }: CreateUserInput): Promise<User> => {
  return prisma.user.create({
    data: {
      email: normalizeEmail(email),
      username: normalizeUsername(username),
      password,
      ...(role ? { role } : {}),
    },
  });
};

export const findUsersByRoles = async (roles: UserRole[]): Promise<User[]> => {
  return prisma.user.findMany({
    where: {
      role: { in: roles },
    },
    orderBy: { username: "asc" },
  });
};

export const findAdmins = async (): Promise<User[]> => {
  return findUsersByRoles([UserRole.ADMIN, UserRole.SUPERADMIN]);
};

export const findAllUsers = async (): Promise<PublicUser[]> => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { username: "asc" },
  });
};

export const findOrCreateUserByEmail = async (email: string, name?: string): Promise<User | null> => {
  if (!email) return null;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const username = name ? name.replace(/\s+/g, "_").toLowerCase() : email.split("@")[0];
  return prisma.user.create({ data: { email, username, password: "" } });
};

export const updateUserRole = async (userId: number, role: UserRole): Promise<User> => {
  return prisma.user.update({ where: { id: userId }, data: { role } });
};

export const updateUserPassword = async (userId: number, hashedPassword: string): Promise<void> => {
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
};