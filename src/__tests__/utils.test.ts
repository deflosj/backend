import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { createLogger } from "../utils/logger";
import { validate } from "../utils/validate";
import { z } from "zod";

describe("HttpError", () => {
  it("creates an error with statusCode and message", () => {
    const error = new HttpError(404, "Not found");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error.name).toBe("HttpError");
  });

  it("has the correct prototype chain", () => {
    const error = new HttpError(500, "Server error");
    expect(error instanceof HttpError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it("supports common HTTP status codes", () => {
    expect(new HttpError(400, "Bad request").statusCode).toBe(400);
    expect(new HttpError(401, "Unauthorized").statusCode).toBe(401);
    expect(new HttpError(403, "Forbidden").statusCode).toBe(403);
    expect(new HttpError(404, "Not found").statusCode).toBe(404);
    expect(new HttpError(500, "Server error").statusCode).toBe(500);
  });
});

describe("Logger", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("log levels", () => {
    it("debug level logs all messages", () => {
      const logger = createLogger("debug");
      logger.debug("test debug");
      logger.info("test info");
      logger.warn("test warn");
      expect(console.log).toHaveBeenCalled();
    });

    it("info level logs info and above", () => {
      const logger = createLogger("info");
      logger.debug("test debug");
      logger.info("test info");
      expect(console.log).toHaveBeenCalled();
    });

    it("warn level logs warn and above", () => {
      (console.warn as jest.Mock).mockClear();
      const logger = createLogger("warn");
      logger.info("test info");
      logger.warn("test warn");
      expect(console.warn).toHaveBeenCalled();
    });

    it("error level logs only errors", () => {
      (console.error as jest.Mock).mockClear();
      const logger = createLogger("error");
      logger.info("test info");
      logger.error("test error");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("log format", () => {
    it("includes timestamp in log message", () => {
      const logger = createLogger("debug");
      logger.info("test message");
      expect(console.log).toHaveBeenCalled();
      const callArg = (console.log as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain("[INFO]");
      expect(callArg).toContain("test message");
    });

    it("includes data in log when provided", () => {
      const logger = createLogger("debug");
      const data = { key: "value" };
      logger.info("test message", data);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("test message"),
        data
      );
    });

    it("handles Error objects in error logs", () => {
      const logger = createLogger("debug");
      const error = new Error("test error");
      logger.error("error occurred", error);
      expect(console.error).toHaveBeenCalled();
    });

    it("handles non-Error values in error logs", () => {
      const logger = createLogger("debug");
      logger.error("error occurred", "string error");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("invalid log levels", () => {
    it("defaults to info level for invalid level", () => {
      const logger = createLogger("invalid");
      logger.info("test");
      expect(console.log).toHaveBeenCalled();
    });
  });
});

describe("validate", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: { name: "Alice" },
      params: { id: "42" },
      query: { page: "2" },
    };
    res = {};
    next = jest.fn();
  });

  it("validates body, params, and query schemas", () => {
    const middleware = validate({
      body: z.object({ name: z.string().min(1) }),
      params: z.object({ id: z.coerce.number().int().positive() }),
      query: z.object({ page: z.coerce.number().int().positive() }),
    });

    middleware(req as Request, res as Response, next);

    expect(req.body).toEqual({ name: "Alice" });
    expect(req.params).toEqual({ id: 42 });
    expect(req.query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });

  it("returns a 400 error when params fail validation", () => {
    req.params = { id: "abc" };

    const middleware = validate({
      params: z.object({ id: z.coerce.number().int().positive() }),
    });

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(HttpError));
    expect((next.mock.calls[0][0] as unknown as HttpError).statusCode).toBe(400);
  });
});
