import {
  test,
  expect,
} from "@playwright/test";

import { DatabaseHelper } from "../../utils/databaseHelper";

const BASE_URL =
  "http://127.0.0.1:3001";

const VALID_TOKEN =
  "practice-secret-token";

/*
 * Serial mode prevents tests inside this describe block
 * from running at the same time.
 */
test.describe.configure({
  mode: "serial",
});

test.describe(
  "API security testing",
  () => {
    const db = new DatabaseHelper();

    /*
     * Important:
     *
     * Do not use db.clearAllUsers() in beforeEach here.
     *
     * The API server and the test process both connect to the same
     * SQLite database. Deleting all users directly from the test
     * process can conflict with writes made by the API server.
     *
     * Every test below uses unique email addresses instead.
     */

    test(
      "Reject request without authentication token",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/users/1`
          );

        expect(response.status()).toBe(401);

        const body =
          await response.json();

        expect(body.error).toBe(
          "AUTHENTICATION_REQUIRED"
        );

        expect(body.message).toBe(
          "Authorization token is required"
        );
      }
    );

    test(
      "Reject request with invalid token",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/users/1`,
            {
              headers: {
                Authorization:
                  "Bearer invalid-token",
              },
            }
          );

        expect(response.status()).toBe(401);

        const body =
          await response.json();

        expect(body.error).toBe(
          "INVALID_TOKEN"
        );

        expect(body.message).toBe(
          "Authorization token is invalid"
        );
      }
    );

    test(
      "Allow request with valid token",
      async ({ request }) => {
        const uniqueEmail =
          `auth.${Date.now()}@example.com`;

        const createResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: {
                name:
                  "Authenticated User",
                email: uniqueEmail,
              },
            }
          );

        expect(
          createResponse.status()
        ).toBe(201);

        const createdUser =
          await createResponse.json();

        expect(createdUser.id).toBeTruthy();
        expect(createdUser.email).toBe(
          uniqueEmail
        );

        const response =
          await request.get(
            `${BASE_URL}/users/${createdUser.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
            }
          );

        expect(response.status()).toBe(200);

        const body =
          await response.json();

        expect(body.id).toBe(
          createdUser.id
        );

        expect(body.email).toBe(
          uniqueEmail
        );
      }
    );

    test(
      "SQL injection style ID should be rejected",
      async ({ request }) => {
        const injectionValue =
          encodeURIComponent(
            "1 OR 1=1"
          );

        const response =
          await request.get(
            `${BASE_URL}/users/${injectionValue}`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
            }
          );

        expect(response.status()).toBe(400);

        const body =
          await response.json();

        expect(body.error).toBe(
          "INVALID_ID"
        );

        expect(body.message).toBe(
          "User ID must be a positive integer"
        );
      }
    );

    test(
      "API should not expose internal database details",
      async ({ request }) => {
        const uniqueEmail =
          `secure.${Date.now()}@example.com`;

        const payload = {
          name: "Secure User",
          email: uniqueEmail,
        };

        const firstResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: payload,
            }
          );

        expect(
          firstResponse.status()
        ).toBe(201);

        const duplicateResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: payload,
            }
          );

        expect(
          duplicateResponse.status()
        ).toBe(409);

        const responseText =
          await duplicateResponse.text();

        expect(
          responseText.toLowerCase()
        ).not.toContain("sqlite");

        expect(
          responseText
        ).not.toContain(
          "database.prepare"
        );

        expect(
          responseText.toLowerCase()
        ).not.toContain("stack");

        const duplicateBody =
          JSON.parse(responseText);

        expect(
          duplicateBody.error
        ).toBe("DUPLICATE_EMAIL");

        expect(
          duplicateBody.message
        ).toBe(
          "A user with this email already exists"
        );
      }
    );

    test(
      "Response should not expose sensitive properties",
      async ({ request }) => {
        const uniqueEmail =
          `safe.${Date.now()}@example.com`;

        const response =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: {
                name: "Safe User",
                email: uniqueEmail,
              },
            }
          );

        expect(response.status()).toBe(201);

        const body =
          await response.json();

        expect(body.id).toBeTruthy();
        expect(body.name).toBe(
          "Safe User"
        );
        expect(body.email).toBe(
          uniqueEmail
        );

        expect(body).not.toHaveProperty(
          "password"
        );

        expect(body).not.toHaveProperty(
          "token"
        );

        expect(body).not.toHaveProperty(
          "secret"
        );

        expect(body).not.toHaveProperty(
          "passwordHash"
        );

        expect(body).not.toHaveProperty(
          "accessToken"
        );

        expect(body).not.toHaveProperty(
          "refreshToken"
        );
      }
    );

    test(
      "Reject unsupported privilege escalation role",
      async ({ request }) => {
        /*
         * Do not expect the whole database count to be zero.
         * Other previous tests may already have created users.
         *
         * Instead, confirm this request did not increase the count.
         */
        const countBeforeRequest =
          db.getUserCount();

        const uniqueEmail =
          `privilege.${Date.now()}@example.com`;

        const response =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: {
                name:
                  "Privilege Escalation User",
                email: uniqueEmail,
                role: "super-admin",
              },
            }
          );

        expect(response.status()).toBe(400);

        const body =
          await response.json();

        expect(body.error).toBe(
          "VALIDATION_ERROR"
        );

        expect(body.message).toBe(
          "Role must be user or admin"
        );

        const countAfterRequest =
          db.getUserCount();

        expect(
          countAfterRequest
        ).toBe(countBeforeRequest);

        const databaseUser =
          db.getUserByEmail(
            uniqueEmail
          );

        expect(
          databaseUser
        ).toBeUndefined();
      }
    );

    test(
      "Delete API should reject missing token",
      async ({ request }) => {
        const uniqueEmail =
          `delete-protected.${Date.now()}@example.com`;

        const createResponse =
          await request.post(
            `${BASE_URL}/users`,
            {
              data: {
                name:
                  "Protected Delete",
                email: uniqueEmail,
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
            `${BASE_URL}/users/${createdUser.id}`
          );

        expect(
          deleteResponse.status()
        ).toBe(401);

        const deleteBody =
          await deleteResponse.json();

        expect(deleteBody.error).toBe(
          "AUTHENTICATION_REQUIRED"
        );

        /*
         * Verify that the unauthorized request did not delete the user.
         */
        const databaseUser =
          db.getUserById(
            createdUser.id
          );

        expect(
          databaseUser
        ).toBeDefined();

        expect(
          databaseUser?.id
        ).toBe(createdUser.id);

        expect(
          databaseUser?.email
        ).toBe(uniqueEmail);
      }
    );
  }
);