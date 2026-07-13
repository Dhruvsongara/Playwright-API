import express, {
  NextFunction,
  Request,
  Response,
} from "express";
import { randomUUID } from "node:crypto";
import {
  database,
  findUserById,
} from "./database";

const app = express();

const HOST = "127.0.0.1";
const PORT = 3001;

const VALID_TOKEN = "practice-secret-token";

interface RequestWithMetadata extends Request {
  requestId?: string;
  startedAt?: number;
}

/*
 * Converts JSON request bodies into JavaScript objects.
 */
app.use(express.json());

/*
 * Observability middleware.
 *
 * It creates or accepts a request ID and logs:
 * method, route, status code and response duration.
 */
app.use(
  (
    request: RequestWithMetadata,
    response: Response,
    next: NextFunction
  ) => {
    request.requestId =
      request.header("x-request-id") ?? randomUUID();

    request.startedAt = performance.now();

    response.setHeader(
      "x-request-id",
      request.requestId
    );

    response.on("finish", () => {
      const durationMs =
        performance.now() -
        (request.startedAt ?? performance.now());

      console.log(
        JSON.stringify({
          requestId: request.requestId,
          method: request.method,
          path: request.path,
          status: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          timestamp: new Date().toISOString(),
        })
      );
    });

    next();
  }
);

/*
 * Simple authentication middleware.
 */
function authenticate(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization =
    request.header("authorization");

  if (!authorization) {
    return response.status(401).json({
      error: "AUTHENTICATION_REQUIRED",
      message: "Authorization token is required",
    });
  }

  if (
    authorization !== `Bearer ${VALID_TOKEN}`
  ) {
    return response.status(401).json({
      error: "INVALID_TOKEN",
      message: "Authorization token is invalid",
    });
  }

  next();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/*
 * Health endpoint for monitoring practice.
 */
app.get("/health", (_request, response) => {
  return response.status(200).json({
    status: "UP",
    service: "users-api",
    timestamp: new Date().toISOString(),
  });
});

/*
 * CREATE USER
 */
app.post("/users", (request, response) => {
  const {
    name,
    email,
    role = "user",
  } = request.body ?? {};

  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length === 0
  ) {
    return response.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Name is required",
    });
  }

  if (
    !email ||
    typeof email !== "string"
  ) {
    return response.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Email is required",
    });
  }

  if (!isValidEmail(email)) {
    return response.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Email format is invalid",
    });
  }

  if (
    role !== "user" &&
    role !== "admin"
  ) {
    return response.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Role must be user or admin",
    });
  }

  try {
    const statement = database.prepare(`
      INSERT INTO users (name, email, role)
      VALUES (?, ?, ?)
    `);

    const result = statement.run(
      name.trim(),
      email.toLowerCase(),
      role
    );

    const createdUser = findUserById(
      Number(result.lastInsertRowid)
    );

    return response
      .status(201)
      .json(createdUser);
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      return response.status(409).json({
        error: "DUPLICATE_EMAIL",
        message:
          "A user with this email already exists",
      });
    }

    console.error("Create user error:", error);

    return response.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Unable to create user",
    });
  }
});

/*
 * GET USER
 *
 * Protected using Bearer token.
 */
app.get(
  "/users/:id",
  authenticate,
  (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: "INVALID_ID",
        message:
          "User ID must be a positive integer",
      });
    }

    const user = findUserById(id);

    if (!user) {
      return response.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return response.status(200).json(user);
  }
);

/*
 * UPDATE USER
 *
 * Protected using Bearer token.
 */
app.put(
  "/users/:id",
  authenticate,
  (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: "INVALID_ID",
        message:
          "User ID must be a positive integer",
      });
    }

    const existingUser = findUserById(id);

    if (!existingUser) {
      return response.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    const {
      name = existingUser.name,
      email = existingUser.email,
      role = existingUser.role,
    } = request.body ?? {};

    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return response.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Name is required",
      });
    }

    if (
      typeof email !== "string" ||
      !isValidEmail(email)
    ) {
      return response.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Email format is invalid",
      });
    }

    if (
      role !== "user" &&
      role !== "admin"
    ) {
      return response.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Role must be user or admin",
      });
    }

    try {
      database
        .prepare(`
          UPDATE users
          SET name = ?, email = ?, role = ?
          WHERE id = ?
        `)
        .run(
          name.trim(),
          email.toLowerCase(),
          role,
          id
        );

      return response
        .status(200)
        .json(findUserById(id));
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        return response.status(409).json({
          error: "DUPLICATE_EMAIL",
          message:
            "A user with this email already exists",
        });
      }

      return response.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to update user",
      });
    }
  }
);

/*
 * DELETE USER
 *
 * Protected using Bearer token.
 */
app.delete(
  "/users/:id",
  authenticate,
  (request, response) => {
    const id = Number(request.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return response.status(400).json({
        error: "INVALID_ID",
        message:
          "User ID must be a positive integer",
      });
    }

    const result = database
      .prepare(`
        DELETE FROM users
        WHERE id = ?
      `)
      .run(id);

    if (result.changes === 0) {
      return response.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return response.status(204).send();
  }
);

/*
 * Handles malformed JSON.
 */
app.use(
  (
    error: Error,
    _request: Request,
    response: Response,
    next: NextFunction
  ) => {
    if (
      error instanceof SyntaxError &&
      "body" in error
    ) {
      return response.status(400).json({
        error: "INVALID_JSON",
        message:
          "Request body contains invalid JSON",
      });
    }

    next(error);
  }
);

/*
 * Handles unknown endpoints.
 */
app.use(
  (
    _request: Request,
    response: Response
  ) => {
    return response.status(404).json({
      error: "ENDPOINT_NOT_FOUND",
      message: "Endpoint not found",
    });
  }
);

app.listen(PORT, HOST, () => {
  console.log(
    `Users API running at http://${HOST}:${PORT}`
  );
});