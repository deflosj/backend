import { createApp } from "../app";
import request from "supertest";

describe("Health Routes", () => {
  const app = createApp();

  it("should return health status at GET /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("environment");
    expect(response.body).toHaveProperty("version");
  });

  it("should return ready status at GET /ready", async () => {
    const response = await request(app).get("/ready");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Not found");
  });
});
