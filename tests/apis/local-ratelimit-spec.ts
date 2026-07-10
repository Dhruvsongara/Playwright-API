import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { executeWithRetry } from "../../utils/retryHelper";

test.describe("Local rate-limit retry testing", () => {
  let server: Server;
  let serverUrl: string;
  let requestCount = 0;

  test.beforeAll(async () => {
    server = createServer((request, response) => {
      if (request.url === "/limited-resource") {
        requestCount++;

        if (requestCount <= 2) {
          response.writeHead(429, {
            "Content-Type": "application/json",
            "Retry-After": "1",
          });

          response.end(
            JSON.stringify({
              message: "Rate limit exceeded",
              attempt: requestCount,
            })
          );

          return;
        }

        response.writeHead(200, {
          "Content-Type": "application/json",
        });

        response.end(
          JSON.stringify({
            message: "Request successful",
            attempt: requestCount,
          })
        );

        return;
      }

      response.writeHead(404, {
        "Content-Type": "application/json",
      });

      response.end(
        JSON.stringify({
          message: "Route not found",
        })
      );
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address() as AddressInfo;

    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  test.beforeEach(() => {
    requestCount = 0;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  test("Wait and retry until rate limit is cleared", async () => {
    const apiContext = await playwrightRequest.newContext({
      baseURL: serverUrl,
    });

    try {
      const result = await executeWithRetry(
        () => apiContext.get("/limited-resource"),
        {
          maxAttempts: 4,
          initialDelayMs: 100,
        }
      );

      expect(result.response.status()).toBe(200);
      expect(result.attempts).toBe(3);

      const body = await result.response.json();

      expect(body.message).toBe("Request successful");
      expect(body.attempt).toBe(3);
    } finally {
      await apiContext.dispose();
    }
  });

    test("Send five requests concurrently", async ({ request }) => {
    const results = await Promise.all(
        Array.from({ length: 5 }, () =>
        request.get("/users/1")
        )
    );

    const statusCodes = results.map((response) => response.status());

    console.log("Status codes:", statusCodes);

    expect(statusCodes.every((status) => status === 200)).toBeTruthy();
    });
});