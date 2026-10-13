import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import config from "../config";

describe("Globale rate limit", () => {
  const app = createApp();

  it("telt leesverzoeken niet mee", async () => {
    for (let i = 0; i < 210; i++) {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    }
  });

  it("laat ingelogde beheerders schrijven zonder limiet", async () => {
    const token = jwt.sign({ sub: "1", role: "ADMIN" }, config.jwtSecret, { algorithm: "HS256" });
    for (let i = 0; i < 210; i++) {
      const res = await request(app).post("/api/bestaat-niet").set("Authorization", `Bearer ${token}`);
      expect(res.status).not.toBe(429);
    }
  });

  it("remt anonieme schrijfacties af na 200 verzoeken", async () => {
    let last = 0;
    for (let i = 0; i < 201; i++) {
      last = (await request(app).post("/api/bestaat-niet")).status;
    }
    expect(last).toBe(429);
  });
});
