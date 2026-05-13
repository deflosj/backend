import { Router, Request, Response } from "express";

const healthRouter = Router();

interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

healthRouter.get("/health", (_req: Request, res: Response<HealthResponse>): void => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "0.1.0",
  });
});

healthRouter.get("/ready", (_req: Request, res: Response<HealthResponse>): void => {
  // This could be extended to check database connectivity in the future
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "0.1.0",
  });
});

export default healthRouter;
