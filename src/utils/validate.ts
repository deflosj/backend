import { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "./httpError";

type ValidationSchemaSet = {
  body?: ZodType<unknown>;
  params?: ZodType<unknown>;
  query?: ZodType<unknown>;
};

function isSchemaSet(value: ZodType<unknown> | ValidationSchemaSet): value is ValidationSchemaSet {
  return typeof value === "object" && value !== null && ("body" in value || "params" in value || "query" in value);
}

function validateTarget<T>(
  req: Request,
  key: keyof Pick<Request, "body" | "params" | "query">,
  schema: ZodType<T>
): void {
  const result = schema.safeParse(req[key]);

  if (!result.success) {
    const message = result.error.issues.map((error) => error.message).join(", ");
    throw new HttpError(400, message);
  }

  req[key] = result.data;
}

export function validate<T>(schema: ZodType<T>): (req: Request, _res: Response, next: NextFunction) => void;
export function validate(schemas: ValidationSchemaSet): (req: Request, _res: Response, next: NextFunction) => void;
export function validate<T>(schemaOrSchemas: ZodType<T> | ValidationSchemaSet) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (isSchemaSet(schemaOrSchemas)) {
        if (schemaOrSchemas.body) {
          validateTarget(req, "body", schemaOrSchemas.body);
        }
        if (schemaOrSchemas.params) {
          validateTarget(req, "params", schemaOrSchemas.params);
        }
        if (schemaOrSchemas.query) {
          validateTarget(req, "query", schemaOrSchemas.query);
        }
      } else {
        validateTarget(req, "body", schemaOrSchemas);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
