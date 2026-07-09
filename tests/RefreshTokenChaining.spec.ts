import {test, expect} from "@playwright/test";

const BASE_URL = "https://dummyjson.com";

test("Login, refresh token, and use new access token", async ({ request }) => {
  const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      username: "emilys",
      password: "emilyspass",
      expiresInMins: 1,
    },
  });

  expect(loginResponse.status()).toBe(200);

  const loginBody = await loginResponse.json();

  const refreshToken = loginBody.refreshToken;

  expect(refreshToken).toBeTruthy();

  const refreshResponse = await request.post(`${BASE_URL}/auth/refresh`, {
    data: {
      refreshToken,
      expiresInMins: 30,
    },
  });

  expect(refreshResponse.status()).toBe(200);

  const refreshBody = await refreshResponse.json();

  const newAccessToken = refreshBody.accessToken;

  expect(newAccessToken).toBeTruthy();

  const meResponse = await request.get(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${newAccessToken}`,
    },
  });

  expect(meResponse.status()).toBe(200);

  const meBody = await meResponse.json();

  expect(meBody.username).toBe("emilys");
});