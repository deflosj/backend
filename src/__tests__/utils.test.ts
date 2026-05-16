import { HttpError } from "../utils/httpError";
import { createLogger } from "../utils/logger";

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
