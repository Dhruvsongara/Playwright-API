import { test, expect } from "@playwright/test";

const BASE_URL = "https://dummyjson.com";

test("Login and use access token for protected API", async ({ request }) => {
  // Step 1: Login API
  const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      username: "emilys",
      password: "emilyspass",
      expiresInMins: 30,
    },
  });

  expect(loginResponse.status()).toBe(200);

  const loginBody = await loginResponse.json();

  // Step 2: Extract token
  const accessToken = loginBody.accessToken;

  expect(accessToken).toBeTruthy();

  console.log("Access Token:", accessToken);

  // Step 3: Use token in next API
  const profileResponse = await request.get(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  expect(profileResponse.status()).toBe(200);

  const profileBody = await profileResponse.json();

  console.log(profileBody);

  // Step 4: Validate authenticated user
  expect(profileBody.id).toBe(loginBody.id);
  expect(profileBody.username).toBe("emilys");
  expect(profileBody.email).toBe(loginBody.email);
});