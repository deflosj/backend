import { User, UserRole } from "@prisma/client";
import prisma from "../database/prisma";

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

export const findAllUsers = async (): Promise<Partial<User>[]> => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { username: "asc" },
  });
};