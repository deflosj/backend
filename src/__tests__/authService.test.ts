import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { registerUser, loginUser, getCurrentUser, refreshTokens, logoutUser } from "../services/auth.service";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameValues,
  findUserById,
} from "../repositories/userRepository";
import { validateCode, consumeCode } from "../services/registrationCode.service";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  deleteRefreshTokenByHash,
  deleteAllUserRefreshTokens,
} from "../repositories/refreshTokenRepository";
import config from "../config";

jest.mock("../repositories/userRepository");
jest.mock("../services/registrationCode.service");
jest.mock("../repositories/refreshTokenRepository");

const VALID_CODE_RECORD = { id: 99, code: "TESTCODE", role: "MEMBER", isActive: true };

const userRepositoryMock = {
  createUser: createUser as jest.Mock,
  findUserByEmailOrUsername: findUserByEmailOrUsername as jest.Mock,
  findUserByEmailOrUsernameValues: findUserByEmailOrUsernameValues as jest.Mock,
  findUserById: findUserById as jest.Mock,
};

const registrationCodeMock = {
  validateCode: validateCode as jest.Mock,
  consumeCode: consumeCode as jest.Mock,
};

const refreshTokenMock = {
  createRefreshToken: createRefreshToken as jest.Mock,
  findRefreshTokenByHash: findRefreshTokenByHash as jest.Mock,
  deleteRefreshTokenByHash: deleteRefreshTokenByHash as jest.Mock,
  deleteAllUserRefreshTokens: deleteAllUserRefreshTokens as jest.Mock,
};

const makeUser = (overrides = {}) => ({
  id: 1,
  email: "user@example.com",
  username: "user",
  password: "hashed",
  role: "MEMBER",
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registrationCodeMock.validateCode.mockResolvedValue(VALID_CODE_RECORD);
    registrationCodeMock.consumeCode.mockResolvedValue(undefined);
    refreshTokenMock.createRefreshToken.mockResolvedValue({ id: 1 });
    refreshTokenMock.deleteRefreshTokenByHash.mockResolvedValue({ count: 1 });
    refreshTokenMock.deleteAllUserRefreshTokens.mockResolvedValue({ count: 1 });
  });

  describe("registerUser", () => {
    it("throws 409 when email already exists", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue({ id: 1 });

      await expect(
        registerUser({ email: "existing@example.com", username: "newuser", password: "password123", inviteCode: "TESTCODE" })
      ).rejects.toMatchObject({ statusCode: 409, message: "A user with that email or username already exists" });
    });

    it("throws 409 when username already exists", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue({ id: 1 });

      await expect(
        registerUser({ email: "new@example.com", username: "existing", password: "password123", inviteCode: "TESTCODE" })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("creates a new user and returns accessToken + refreshToken", async () => {
      const hashedPassword = await hashPassword("password123");
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
      userRepositoryMock.createUser.mockResolvedValue(makeUser({ id: 1, email: "new@example.com", username: "newuser", password: hashedPassword }));

      const result = await registerUser({ email: "new@example.com", username: "newuser", password: "password123", inviteCode: "TESTCODE" });

      expect(result.user.email).toBe("new@example.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(userRepositoryMock.createUser).toHaveBeenCalled();
    });

    it("access token contains correct payload", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
      userRepositoryMock.createUser.mockResolvedValue(makeUser({ id: 42, email: "test@example.com", username: "testuser" }));

      const result = await registerUser({ email: "test@example.com", username: "testuser", password: "password123", inviteCode: "TESTCODE" });

      const decoded = jwt.verify(result.accessToken, config.jwtSecret) as any;
      expect(decoded.sub).toBe("42");
      expect(decoded.email).toBe("test@example.com");
    });

    it("access token expires in 15 minutes", async () => {
      userRepositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
      userRepositoryMock.createUser.mockResolvedValue(makeUser({ id: 1 }));

      const result = await registerUser({ email: "test@example.com", username: "testuser", password: "password123", inviteCode: "TESTCODE" });

      const decoded = jwt.verify(result.accessToken, config.jwtSecret) as any;
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(15 * 60);
    });
  });

  describe("loginUser", () => {
    it("throws 401 when user not found", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(null);

      await expect(loginUser({ identifier: "unknown@example.com", password: "password123" }))
        .rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
    });

    it("throws 403 when user account is disabled", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(
        makeUser({ password: await hashPassword("password123"), isActive: false })
      );

      await expect(loginUser({ identifier: "user@example.com", password: "password123" }))
        .rejects.toMatchObject({ statusCode: 403, message: "User account is disabled" });
    });

    it("throws 401 when password is incorrect", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(
        makeUser({ password: await hashPassword("correctpassword") })
      );

      await expect(loginUser({ identifier: "user@example.com", password: "wrongpassword" }))
        .rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
    });

    it("returns accessToken and refreshToken on success", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(
        makeUser({ password: await hashPassword("password123") })
      );

      const result = await loginUser({ identifier: "user@example.com", password: "password123" });

      expect(result.user.email).toBe("user@example.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("stores hashed refresh token in DB", async () => {
      userRepositoryMock.findUserByEmailOrUsername.mockResolvedValue(
        makeUser({ password: await hashPassword("password123") })
      );

      const result = await loginUser({ identifier: "user@example.com", password: "password123" });

      expect(refreshTokenMock.createRefreshToken).toHaveBeenCalledTimes(1);
      const [, storedHash] = refreshTokenMock.createRefreshToken.mock.calls[0];
      expect(storedHash).not.toBe(result.refreshToken);
    });
  });

  describe("refreshTokens", () => {
    it("throws 401 when refresh token not found", async () => {
      refreshTokenMock.findRefreshTokenByHash.mockResolvedValue(null);

      await expect(refreshTokens("invalid-token"))
        .rejects.toMatchObject({ statusCode: 401, message: "Invalid or expired refresh token" });
    });

    it("throws 401 when refresh token is expired", async () => {
      const expired = new Date(Date.now() - 1000);
      refreshTokenMock.findRefreshTokenByHash.mockResolvedValue({
        id: 1, token: "hash", expiresAt: expired, user: makeUser(),
      });

      await expect(refreshTokens("some-token"))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it("throws 403 when user is disabled", async () => {
      const future = new Date(Date.now() + 86400000);
      refreshTokenMock.findRefreshTokenByHash.mockResolvedValue({
        id: 1, token: "hash", expiresAt: future, user: makeUser({ isActive: false }),
      });

      await expect(refreshTokens("some-token"))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it("rotates tokens and returns new pair", async () => {
      const future = new Date(Date.now() + 86400000);
      refreshTokenMock.findRefreshTokenByHash.mockResolvedValue({
        id: 1, token: "hash", expiresAt: future, user: makeUser({ id: 5 }),
      });

      const result = await refreshTokens("old-raw-token");

      expect(refreshTokenMock.deleteRefreshTokenByHash).toHaveBeenCalledTimes(1);
      expect(refreshTokenMock.createRefreshToken).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe("logoutUser", () => {
    it("deletes the hashed refresh token from DB", async () => {
      await logoutUser("some-raw-token");

      expect(refreshTokenMock.deleteRefreshTokenByHash).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCurrentUser", () => {
    it("throws 404 when user not found", async () => {
      userRepositoryMock.findUserById.mockResolvedValue(null);

      await expect(getCurrentUser(99)).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    it("throws 404 when user is inactive", async () => {
      userRepositoryMock.findUserById.mockResolvedValue(makeUser({ isActive: false }));

      await expect(getCurrentUser(1)).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    it("returns public user when found and active", async () => {
      userRepositoryMock.findUserById.mockResolvedValue(makeUser());

      const result = await getCurrentUser(1);

      expect(result.email).toBe("user@example.com");
      expect((result as any).password).toBeUndefined();
    });
  });
});
