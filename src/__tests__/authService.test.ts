import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerUser, loginUser, getCurrentUser } from "../services/authService";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameValues,
  findUserById,
} from "../repositories/userRepository";
import { validateCode, consumeCode } from "../services/registrationCodeService";
import config from "../config";

jest.mock("../repositories/userRepository");
jest.mock("../services/registrationCodeService");

const registrationCodeMock = {
  validateCode: validateCode as jest.Mock,
  consumeCode: consumeCode as jest.Mock,
};

const VALID_CODE_RECORD = { id: 99, code: "TESTCODE", role: "MEMBER", isActive: true };

const userRepositoryMock = {
  createUser: createUser as jest.Mock,
  findUserByEmailOrUsername: findUserByEmailOrUsername as jest.Mock,
  findUserByEmailOrUsernameValues: findUserByEmailOrUsernameValues as jest.Mock,
  findUserById: findUserById as jest.Mock,
};

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registrationCodeMock.validateCode.mockResolvedValue(VALID_CODE_RECORD);
    registrationCodeMock.consumeCode.mockResolvedValue(undefined);
  });

  describe("registerUser", () => {
    it("throws 409 when email already exists", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue({ id: 1 });

      await expect(
        registerUser({
          email: "existing@example.com",
          username: "newuser",
          password: "password123",
          inviteCode: "TESTCODE",
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "A user with that email or username already exists",
      });
    });

    it("throws 409 when username already exists", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue({ id: 1 });

      await expect(
        registerUser({
          email: "new@example.com",
          username: "existing",
          password: "password123",
          inviteCode: "TESTCODE",
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("creates a new user with hashed password", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
      userRepositoryMock.createUser.mockResolvedValue({
        id: 1,
        email: "new@example.com",
        username: "newuser",
        password: hashedPassword,
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await registerUser({
        email: "new@example.com",
        username: "newuser",
        password: "password123",
        inviteCode: "TESTCODE",
      });

      expect(result.user.email).toBe("new@example.com");
      expect(result.token).toBeDefined();
      expect(userRepositoryMock.createUser).toHaveBeenCalled();
    });

    it("returns token with correct payload", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
      userRepositoryMock.createUser.mockResolvedValue({
        id: 42,
        email: "test@example.com",
        username: "testuser",
        password: "hashed",
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await registerUser({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
        inviteCode: "TESTCODE",
      });

      const decoded = jwt.verify(result.token, config.jwtSecret) as any;
      expect(decoded.sub).toBe("42");
      expect(decoded.email).toBe("test@example.com");
    });
  });

  describe("loginUser", () => {
    it("throws 401 when user not found", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(null);

      await expect(
        loginUser({
          identifier: "unknown@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid credentials",
      });
    });

    it("throws 403 when user account is disabled", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue({
        id: 1,
        email: "user@example.com",
        username: "user",
        password: await bcrypt.hash("password123", 10),
        role: "MEMBER",
        avatarUrl: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        loginUser({
          identifier: "user@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "User account is disabled",
      });
    });

    it("throws 401 when password is incorrect", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue({
        id: 1,
        email: "user@example.com",
        username: "user",
        password: await bcrypt.hash("correctpassword", 10),
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        loginUser({
          identifier: "user@example.com",
          password: "wrongpassword",
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid credentials",
      });
    });

    it("successfully logs in with correct password", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue({
        id: 1,
        email: "user@example.com",
        username: "user",
        password: hashedPassword,
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await loginUser({
        identifier: "user@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("user@example.com");
      expect(result.token).toBeDefined();
    });

    it("accepts email or username as identifier", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = {
        id: 1,
        email: "user@example.com",
        username: "myusername",
        password: hashedPassword,
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(user);

      const result1 = await loginUser({
        identifier: "user@example.com",
        password: "password123",
      });

      const result2 = await loginUser({
        identifier: "myusername",
        password: "password123",
      });

      expect(result1.user.id).toBe(1);
      expect(result2.user.id).toBe(1);
    });
  });

  describe("getCurrentUser", () => {
    it("throws 404 when user not found", async () => {
      userRepositoryMock.findUserById.mockResolvedValue(null);

      await expect(getCurrentUser(99)).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });

    it("throws 404 when user is inactive", async () => {
      userRepositoryMock.findUserById.mockResolvedValue({
        id: 1,
        email: "user@example.com",
        username: "user",
        password: "hashed",
        role: "MEMBER",
        avatarUrl: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(getCurrentUser(1)).rejects.toMatchObject({
        statusCode: 404,
        message: "User not found",
      });
    });

    it("returns user when found and active", async () => {
      userRepositoryMock.findUserById.mockResolvedValue({
        id: 1,
        email: "user@example.com",
        username: "user",
        password: "hashed",
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getCurrentUser(1);

      expect(result.email).toBe("user@example.com");
      expect(result.username).toBe("user");
      expect(result.role).toBe("MEMBER");
    });

    it("does not include password in result", async () => {
      userRepositoryMock.findUserById.mockResolvedValue({
        id: 1,
        email: "user@example.com",
        username: "user",
        password: "hashed-secret",
        role: "MEMBER",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getCurrentUser(1);

      expect((result as any).password).toBeUndefined();
    });
  });
});
