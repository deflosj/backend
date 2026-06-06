import request from "supertest";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import config from "../config";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameValues,
  findUserById,
} from "../repositories/userRepository";
import {
  createRefreshToken,
  deleteRefreshTokenByHash,
  findRefreshTokenByHash,
} from "../repositories/refreshTokenRepository";

jest.mock("../repositories/userRepository", () => ({
  __esModule: true,
  createUser: jest.fn(),
  findUserByEmailOrUsername: jest.fn(),
  findUserByEmailOrUsernameValues: jest.fn(),
  findUserById: jest.fn(),
}));

jest.mock("../repositories/refreshTokenRepository", () => ({
  __esModule: true,
  createRefreshToken: jest.fn(),
  findRefreshTokenByHash: jest.fn(),
  deleteRefreshTokenByHash: jest.fn(),
}));

const repositoryMock = {
  createUser: createUser as jest.Mock,
  findUserByEmailOrUsername: findUserByEmailOrUsername as jest.Mock,
  findUserByEmailOrUsernameValues: findUserByEmailOrUsernameValues as jest.Mock,
  findUserById: findUserById as jest.Mock,
};

const refreshTokenMock = {
  createRefreshToken: createRefreshToken as jest.Mock,
  findRefreshTokenByHash: findRefreshTokenByHash as jest.Mock,
  deleteRefreshTokenByHash: deleteRefreshTokenByHash as jest.Mock,
};

const getSetCookie = (response: { headers: Record<string, unknown> }, cookieName: string): string => {
  const setCookieHeaders = response.headers["set-cookie"] as string[] | undefined;

  if (!setCookieHeaders) {
    throw new Error(`Missing set-cookie headers for ${cookieName}`);
  }

  const cookieHeader = setCookieHeaders.find((value) => value.startsWith(`${cookieName}=`));

  if (!cookieHeader) {
    throw new Error(`Missing ${cookieName} cookie`);
  }

  return cookieHeader;
};

const getCookieValue = (response: { headers: Record<string, unknown> }, cookieName: string): string =>
  getSetCookie(response, cookieName).split(";")[0].split("=").slice(1).join("=");

const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });

describe("Auth Routes", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    refreshTokenMock.createRefreshToken.mockResolvedValue({ id: 1 });
    refreshTokenMock.deleteRefreshTokenByHash.mockResolvedValue({ count: 1 });
  });

  it("should register a new user", async () => {
    repositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
    repositoryMock.createUser.mockResolvedValue({
      id: 1,
      email: "member@example.com",
      username: "member1",
      password: await hashPassword("password123"),
      role: "MEMBER",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const response = await request(app).post("/api/auth/register").send({
      email: "member@example.com",
      username: "member1",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).not.toHaveProperty("refreshToken");
    expect(response.body.user).toMatchObject({
      email: "member@example.com",
      username: "member1",
      role: "MEMBER",
    });
    expect(getSetCookie(response, "refreshToken")).toContain("HttpOnly");
    expect(getSetCookie(response, "refreshToken")).toContain("Secure");
    expect(getSetCookie(response, "refreshToken")).toContain("SameSite=Lax");
    expect(getSetCookie(response, "csrfToken")).toContain("Secure");
    expect(getSetCookie(response, "csrfToken")).toContain("SameSite=Lax");
  });

  it("should login an existing user", async () => {
    repositoryMock.findUserByEmailOrUsername.mockResolvedValue({
      id: 2,
      email: "coach@example.com",
      username: "coach",
      password: await hashPassword("secret123"),
      role: "CAPTAIN",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const response = await request(app).post("/api/auth/login").send({
      identifier: "coach@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: "coach@example.com",
      username: "coach",
      role: "CAPTAIN",
    });
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).not.toHaveProperty("refreshToken");
    expect(getSetCookie(response, "refreshToken")).toContain("HttpOnly");
    expect(getSetCookie(response, "csrfToken")).toContain("Secure");
  });

  it("should refresh tokens using the refresh cookie and CSRF header", async () => {
    repositoryMock.findUserByEmailOrUsername.mockResolvedValue({
      id: 2,
      email: "coach@example.com",
      username: "coach",
      password: await hashPassword("secret123"),
      role: "CAPTAIN",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const future = new Date(Date.now() + 86400000);
    refreshTokenMock.findRefreshTokenByHash.mockResolvedValue({
      id: 1,
      token: "hash",
      expiresAt: future,
      user: {
        id: 2,
        email: "coach@example.com",
        username: "coach",
        password: await hashPassword("secret123"),
        role: "CAPTAIN",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date("2026-05-12T10:00:00.000Z"),
        updatedAt: new Date("2026-05-12T10:00:00.000Z"),
      },
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      identifier: "coach@example.com",
      password: "secret123",
    });

    const refreshCookie = getCookieValue(loginResponse, "refreshToken");
    const csrfCookie = getCookieValue(loginResponse, "csrfToken");

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${refreshCookie}; csrfToken=${csrfCookie}`)
      .set("x-csrf-token", csrfCookie);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).not.toHaveProperty("refreshToken");
    expect(getSetCookie(response, "refreshToken")).toContain("HttpOnly");
    expect(getSetCookie(response, "csrfToken")).toContain("Secure");
  });

  it("rejects cookie-auth refresh without CSRF header", async () => {
    repositoryMock.findUserByEmailOrUsername.mockResolvedValue({
      id: 2,
      email: "coach@example.com",
      username: "coach",
      password: await hashPassword("secret123"),
      role: "CAPTAIN",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      identifier: "coach@example.com",
      password: "secret123",
    });

    const refreshCookie = getCookieValue(loginResponse, "refreshToken");
    const csrfCookie = getCookieValue(loginResponse, "csrfToken");

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${refreshCookie}; csrfToken=${csrfCookie}`);

    expect(response.status).toBe(403);
  });

  it("logs out using the refresh cookie and clears auth cookies", async () => {
    repositoryMock.findUserByEmailOrUsername.mockResolvedValue({
      id: 2,
      email: "coach@example.com",
      username: "coach",
      password: await hashPassword("secret123"),
      role: "CAPTAIN",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      identifier: "coach@example.com",
      password: "secret123",
    });

    const refreshCookie = getCookieValue(loginResponse, "refreshToken");
    const csrfCookie = getCookieValue(loginResponse, "csrfToken");

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `refreshToken=${refreshCookie}; csrfToken=${csrfCookie}`)
      .set("x-csrf-token", csrfCookie);

    expect(response.status).toBe(204);
    expect(refreshTokenMock.deleteRefreshTokenByHash).toHaveBeenCalled();
    expect(getSetCookie(response, "refreshToken")).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(getSetCookie(response, "csrfToken")).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });

  it("should return the authenticated user profile", async () => {
    const token = jwt.sign(
      {
        email: "admin@example.com",
        username: "admin",
        role: "ADMIN",
      },
      config.jwtSecret,
      {
        subject: "3",
      }
    );

    repositoryMock.findUserById.mockResolvedValue({
      id: 3,
      email: "admin@example.com",
      username: "admin",
      password: "hashed-password",
      role: "ADMIN",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: "admin@example.com",
      username: "admin",
      role: "ADMIN",
    });
  });
});