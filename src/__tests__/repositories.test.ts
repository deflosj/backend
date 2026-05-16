import { User } from "@prisma/client";
import prisma from "../database/prisma";
import {
  findUserByEmailOrUsername,
  findUserById,
  findUserByEmailOrUsernameValues,
  createUser,
} from "../repositories/userRepository";

jest.mock("../database/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

const mockUser: User = {
  id: 1,
  email: "user@example.com",
  username: "user",
  password: "hashed",
  role: "MEMBER",
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("User Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findUserByEmailOrUsername", () => {
    it("finds user by email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await findUserByEmailOrUsername("user@example.com");

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: "user@example.com" }, { username: "user@example.com" }],
        },
      });
    });

    it("normalizes email to lowercase", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await findUserByEmailOrUsername("USER@EXAMPLE.COM");

      const callArg = mockPrisma.user.findFirst.mock.calls[0][0];
      expect(callArg.where.OR[0].email).toBe("user@example.com");
    });

    it("returns null when user not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await findUserByEmailOrUsername("unknown@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("finds user by id", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await findUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("returns null when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await findUserById(99);

      expect(result).toBeNull();
    });
  });

  describe("findUserByEmailOrUsernameValues", () => {
    it("finds user by either email or username", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await findUserByEmailOrUsernameValues("user@example.com", "user");

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
    });

    it("normalizes email and username", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await findUserByEmailOrUsernameValues("  USER@EXAMPLE.COM  ", "  USER  ");

      const callArg = mockPrisma.user.findFirst.mock.calls[0][0];
      expect(callArg.where.OR[0].email).toBe("user@example.com");
      expect(callArg.where.OR[1].username).toBe("USER");
    });
  });

  describe("createUser", () => {
    it("creates a new user with normalized email and username", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await createUser({
        email: "  NEW@EXAMPLE.COM  ",
        username: "  newuser  ",
        password: "hashed",
      });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "new@example.com",
          username: "newuser",
          password: "hashed",
        },
      });
    });
  });
});
