import dotenv from "dotenv";

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  apiVersion: string;
  apiPrefix: string;
  jwtSecret: string;
  jwtExpiry: string;
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

const getConfig = (): Config => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "localhost";
  const apiVersion = process.env.API_VERSION || "v1";
  const apiPrefix = process.env.API_PREFIX || "/api";
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-key";
  const jwtExpiry = process.env.JWT_EXPIRY || "7d";
  const logLevel = process.env.LOG_LEVEL || "info";
  const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");

  if (nodeEnv === "production") {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required in production");
    }
  }

  return {
    nodeEnv,
    port,
    host,
    apiVersion,
    apiPrefix,
    jwtSecret,
    jwtExpiry,
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
