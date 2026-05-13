import { User } from "@prisma/client";
import prisma from "../database/prisma";

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
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

export const createUser = async ({ email, username, password }: CreateUserInput): Promise<User> => {
  return prisma.user.create({
    data: {
      email: normalizeEmail(email),
      username: normalizeUsername(username),
      password,
    },
  });
};