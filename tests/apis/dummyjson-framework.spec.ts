import { test, expect } from "@playwright/test";
import { AuthApi } from "../../api/authApi";
import { UserApi } from "../../api/userApi";
import { ApiClient } from "../../api/clientApi";
import { validLoginData, invalidLoginData } from "../../test-data/authData";
import { userIds, invalidUserIds } from "../../test-data/userData";

test.describe("DummyJSON API Automation Framework Practice", () => {
  test("Login and get current user using token chaining", async ({ request }) => {
    const authApi = new AuthApi(request);
    const userApi = new UserApi(request);

    const token = await authApi.login(
      validLoginData.username,
      validLoginData.password
    );

    const response = await userApi.getCurrentUser(token);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.username).toBe(validLoginData.username);
    expect(body.email).toBeTruthy();
    expect(body.id).toBeTruthy();
  });

  test("Invalid login error handling", async ({ request }) => {
    const authApi = new AuthApi(request);

    const response = await authApi.loginInvalid(
      invalidLoginData.username,
      invalidLoginData.password
    );

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.message).toBeTruthy();
  });

  for (const userId of userIds) {
    test(`Data driven test - get valid user with ID ${userId}`, async ({
      request,
    }) => {
      const userApi = new UserApi(request);

      const response = await userApi.getUserById(userId);

      expect(response.status()).toBe(200);

      const body = await response.json();

      expect(body.id).toBe(userId);
      expect(body.firstName).toBeTruthy();
      expect(body.email).toContain("@");
    });
  }

  for (const invalidUserId of invalidUserIds) {
    test(`Data driven negative test - invalid user ID ${invalidUserId}`, async ({
      request,
    }) => {
      const userApi = new UserApi(request);

      const response = await userApi.getUserById(invalidUserId);

      expect(response.status()).toBe(404);

      const body = await response.json();

      expect(body.message).toContain("not found");
    });
  }

  test("Retry handling example", async ({ request }) => {
    const apiClient = new ApiClient(request);

    const response = await apiClient.getWithRetry(
      "https://dummyjson.com/users/1",
      {},
      3
    );

    await apiClient.validateStatus(response, 200);

    const body = await apiClient.parseJson(response);

    expect(body.id).toBe(1);
    expect(body.email).toBeTruthy();
  });
});