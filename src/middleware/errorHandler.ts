import { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger";
import config from "../config";
import { HttpError } from "../utils/httpError";

const logger = createLogger(config.logLevel);

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
  });
  next();
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error("Unhandled error", err);

  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message =
    err instanceof HttpError || process.env.NODE_ENV !== "production"
      ? err.message
      : "Internal server error";

  res.status(statusCode).json({
    status: "error",
    message,
    timestamp: new Date().toISOString(),
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    status: "error",
    message: "Not found",
    timestamp: new Date().toISOString(),
  });
};
