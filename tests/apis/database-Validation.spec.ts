import {
  test,
  expect,
} from "@playwright/test";
import { DatabaseHelper } from "../../utils/databaseHelper";

const BASE_URL =
  "http://127.0.0.1:3001";

const VALID_TOKEN =
  "practice-secret-token";

test.describe(
  "Database validation with API testing",
  () => {
    const db = new DatabaseHelper();

    test.beforeEach(() => {
      db.clearAllUsers();
    });

    test(
      "Create user through API and validate database",
      async ({ request }) => {
        const payload = {
          name: "Dhruv Songara",
          email: `dhruv.${Date.now()}@example.com`,
          role: "user",
        };

        const response =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: payload,
            }
          );

        expect(response.status()).toBe(201);

        const responseBody =
          await response.json();

        expect(responseBody.id).toBeTruthy();
        expect(responseBody.name).toBe(
          payload.name
        );
        expect(responseBody.email).toBe(
          payload.email
        );
        expect(responseBody.role).toBe(
          payload.role
        );

        const databaseUser =
          db.getUserById(responseBody.id);

        expect(databaseUser).toBeDefined();

        expect(databaseUser?.id).toBe(
          responseBody.id
        );

        expect(databaseUser?.name).toBe(
          payload.name
        );

        expect(databaseUser?.email).toBe(
          payload.email
        );

        expect(databaseUser?.role).toBe(
          "user"
        );

        expect(
          databaseUser?.created_at
        ).toBeTruthy();

        expect(db.getUserCount()).toBe(1);
      }
    );

    test(
      "Update user through API and validate database",
      async ({ request }) => {
        const createResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: {
                name: "Original Name",
                email: `original.${Date.now()}@example.com`,
                role: "user",
              },
            }
          );

        expect(
          createResponse.status()
        ).toBe(201);

        const createdUser =
          await createResponse.json();

        const updatePayload = {
          name: "Updated Name",
          email: `updated.${Date.now()}@example.com`,
          role: "admin",
        };

        const updateResponse =
          await request.put(
            `${BASE_URL}/users/${createdUser.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
              data: updatePayload,
            }
          );

        expect(
          updateResponse.status()
        ).toBe(200);

        const updateBody =
          await updateResponse.json();

        expect(updateBody.name).toBe(
          "Updated Name"
        );

        expect(updateBody.role).toBe(
          "admin"
        );

        const databaseUser =
          db.getUserById(createdUser.id);

        expect(databaseUser).toBeDefined();

        expect(databaseUser?.name).toBe(
          updatePayload.name
        );

        expect(databaseUser?.email).toBe(
          updatePayload.email
        );

        expect(databaseUser?.role).toBe(
          "admin"
        );

        expect(db.getUserCount()).toBe(1);
      }
    );

    test(
      "Delete user through API and validate database",
      async ({ request }) => {
        const createResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: {
                name: "Delete User",
                email: `delete.${Date.now()}@example.com`,
              },
            }
          );

        expect(
          createResponse.status()
        ).toBe(201);

        const createdUser =
          await createResponse.json();

        const deleteResponse =
          await request.delete(
            `${BASE_URL}/users/${createdUser.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
            }
          );

        expect(
          deleteResponse.status()
        ).toBe(204);

        const databaseUser =
          db.getUserById(createdUser.id);

        expect(databaseUser).toBeUndefined();

        expect(db.getUserCount()).toBe(0);
      }
    );

    test(
      "Duplicate API request should not create duplicate database record",
      async ({ request }) => {
        const payload = {
          name: "Duplicate User",
          email: `duplicate.${Date.now()}@example.com`,
        };

        const firstResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: payload,
            }
          );

        const secondResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: payload,
            }
          );

        expect(
          firstResponse.status()
        ).toBe(201);

        expect(
          secondResponse.status()
        ).toBe(409);

        expect(db.getUserCount()).toBe(1);

        const databaseUser =
          db.getUserByEmail(payload.email);

        expect(databaseUser).toBeDefined();
      }
    );
  }
);