import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import config from "../config";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserByEmailOrUsernameValues,
  findUserById,
} from "../repositories/userRepository";

jest.mock("../repositories/userRepository", () => ({
  __esModule: true,
  createUser: jest.fn(),
  findUserByEmailOrUsername: jest.fn(),
  findUserByEmailOrUsernameValues: jest.fn(),
  findUserById: jest.fn(),
}));

const repositoryMock = {
  createUser: createUser as jest.Mock,
  findUserByEmailOrUsername: findUserByEmailOrUsername as jest.Mock,
  findUserByEmailOrUsernameValues: findUserByEmailOrUsernameValues as jest.Mock,
  findUserById: findUserById as jest.Mock,
};

describe("Auth Routes", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a new user", async () => {
    repositoryMock.findUserByEmailOrUsernameValues.mockResolvedValue(null);
    repositoryMock.createUser.mockResolvedValue({
      id: 1,
      email: "member@example.com",
      username: "member1",
      password: await bcrypt.hash("password123", 10),
      role: "MEMBER",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const response = await request(app).post("/auth/register").send({
      email: "member@example.com",
      username: "member1",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toMatchObject({
      email: "member@example.com",
      username: "member1",
      role: "MEMBER",
      isActive: true,
    });
  });

  it("should login an existing user", async () => {
    repositoryMock.findUserByEmailOrUsername.mockResolvedValue({
      id: 2,
      email: "coach@example.com",
      username: "coach",
      password: await bcrypt.hash("secret123", 10),
      role: "CAPTAIN",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date("2026-05-12T10:00:00.000Z"),
      updatedAt: new Date("2026-05-12T10:00:00.000Z"),
    });

    const response = await request(app).post("/auth/login").send({
      identifier: "coach@example.com",
      password: "secret123",
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: "coach@example.com",
      username: "coach",
      role: "CAPTAIN",
    });
    expect(response.body).toHaveProperty("token");
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
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: "admin@example.com",
      username: "admin",
      role: "ADMIN",
    });
  });
});