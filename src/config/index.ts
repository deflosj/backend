import dotenv from "dotenv";

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  jwtSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  logLevel: string;
  corsOrigin: string[];
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

const MIN_JWT_SECRET_LENGTH = 64;
const DEV_JWT_SECRET = "dev-secret-key-dev-secret-key-dev-secret-key-dev-secret-key-dev-secret-key";

const getConfig = (): Config => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isLocalEnv = nodeEnv === "development" || nodeEnv === "test";

  if (!process.env.JWT_SECRET && !isLocalEnv) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  if (!process.env.DATABASE_URL && nodeEnv === "production") {
    throw new Error("DATABASE_URL environment variable is required in production");
  }

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "localhost";
  const apiPrefix = process.env.API_PREFIX || "/api";
  const jwtSecret = process.env.JWT_SECRET || (isLocalEnv ? DEV_JWT_SECRET : "");

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }

  const accessTokenExpiry = "15m";
  const refreshTokenExpiry = "30d";
  const logLevel = process.env.LOG_LEVEL || "info";
  const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");

  return {
    nodeEnv,
    port,
    host,
    apiPrefix,
    jwtSecret,
    accessTokenExpiry,
    refreshTokenExpiry,
    logLevel,
    corsOrigin,
    database: {
      url: process.env.DATABASE_URL || "postgresql://localhost/vzw_db",
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "5432", 10),
      name: process.env.DB_NAME || "vzw_db",
      user: process.env.DB_USER || "vzw_user",
      password: process.env.DB_PASSWORD || "password",
    },
  };
};

const config = getConfig();

export default config;
