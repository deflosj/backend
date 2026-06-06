import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../app";
import config from "../config";

describe("Roles Routes", () => {
  const app = createApp();

  it("returns the centralized role matrix for admins", async () => {
    const token = jwt.sign(
      {
        email: "admin@example.com",
        username: "admin",
        role: "ADMIN",
      },
      config.jwtSecret,
      { subject: "1" }
    );

    const response = await request(app).get("/api/roles").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.access).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accessKey: "manageRoles",
          label: "Role matrix",
          description: "View the centralized permission matrix.",
          roles: ["ADMIN", "SUPERADMIN"],
        }),
        expect.objectContaining({
          accessKey: "manageTournamentOperations",
          roles: ["REFEREE", "ADMIN", "SUPERADMIN"],
        }),
      ])
    );
  });

  it("rejects non-admin users", async () => {
    const token = jwt.sign(
      {
        email: "member@example.com",
        username: "member",
        role: "MEMBER",
      },
      config.jwtSecret,
      { subject: "2" }
    );

    const response = await request(app).get("/api/roles").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Insufficient permissions");
  });
});