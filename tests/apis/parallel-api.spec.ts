import { test, expect } from "@playwright/test";
import { validUserIds } from "../../test-data/userData";

test.describe.configure({ mode: "parallel" });

for (const userId of validUserIds) {
  test(`Get user ${userId}`, async ({ request }) => {
    const response = await request.get(`https://dummyjson.com/users/${userId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.id).toBe(userId);
    expect(body.firstName).toBeTruthy();
    expect(body.email).toContain("@");
  });
}


test("Fetch multiple users concurrently", async ({ request }) => {
  const userIds = [1, 2, 3, 4, 5];

  const responses = await Promise.all(
    userIds.map((userId) => request.get(`https://dummyjson.com/users/${userId}`))
  );

  expect(responses).toHaveLength(userIds.length);

  for (let index = 0; index < responses.length; index++) {
    const response = responses[index];
    const expectedUserId = userIds[index];

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.id).toBe(expectedUserId);
  }
});