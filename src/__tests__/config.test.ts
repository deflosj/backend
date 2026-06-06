describe("config JWT validation", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it("rejects JWT secrets shorter than 64 characters", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      JWT_SECRET: "too-short",
      DATABASE_URL: "postgresql://localhost/vzw_db",
    };

    expect(() => require("../config").default).toThrow(
      "JWT_SECRET must be at least 64 characters long"
    );
  });
});