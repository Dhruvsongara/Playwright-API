import { test, expect } from "@playwright/test";
import { executeWithRetry } from "../../utils/retryHelper";

const BASE_URL = "https://dummyjson.com";

test("Retry transient server failure", async ({ request }) => {
  const result = await executeWithRetry(
    () =>
      request.get(
        `${BASE_URL}/http/503/Service%20temporarily%20unavailable`
      ),
    {
      maxAttempts: 3,
      initialDelayMs: 200,
      backoffMultiplier: 2,
    }
  );

  expect(result.response.status()).toBe(503);
  expect(result.attempts).toBe(3);

  console.log(`Final status: ${result.response.status()}`);
  console.log(`Total attempts: ${result.attempts}`);
});

test("Do not retry a 404 response", async ({ request }) => {
  const result = await executeWithRetry(
    () => request.get(`${BASE_URL}/users/999999`),
    {
      maxAttempts: 3,
    }
  );

  expect(result.response.status()).toBe(404);

  // 404 is not retryable, so only one request should occur.
  expect(result.attempts).toBe(1);

  const body = await result.response.json();

  expect(body.message).toBeTruthy();
});