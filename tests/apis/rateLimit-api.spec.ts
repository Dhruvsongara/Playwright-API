import { test, expect } from "@playwright/test";

const BASE_URL = "https://dummyjson.com";

test("Validate 429 Too Many Requests response", async ({ request }) => {
  const message = encodeURIComponent("Too many requests");

  const response = await request.get(
    `${BASE_URL}/http/429/${message}`
  );

  expect(response.status()).toBe(429);
  expect(response.ok()).toBeFalsy();

  const body = await response.json();

  console.log("Rate-limit response:", body);

  expect(body).toBeTruthy();
});

