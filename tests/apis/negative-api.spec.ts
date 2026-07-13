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
  "Negative API testing",
  () => {
    const db = new DatabaseHelper();

    test.beforeEach(() => {
      db.clearAllUsers();
    });

    const invalidPayloads = [
      {
        title: "missing name",
        payload: {
          email:
            "missing-name@example.com",
        },
        expectedMessage:
          "Name is required",
      },
      {
        title: "missing email",
        payload: {
          name: "Dhruv",
        },
        expectedMessage:
          "Email is required",
      },
      {
        title: "invalid email",
        payload: {
          name: "Dhruv",
          email: "invalid-email",
        },
        expectedMessage:
          "Email format is invalid",
      },
      {
        title: "number as name",
        payload: {
          name: 12345,
          email:
            "number-name@example.com",
        },
        expectedMessage:
          "Name is required",
      },
      {
        title: "invalid role",
        payload: {
          name: "Dhruv",
          email:
            "invalid-role@example.com",
          role: "super-admin",
        },
        expectedMessage:
          "Role must be user or admin",
      },
    ];

    for (
      const testData of invalidPayloads
    ) {
      test(
        `Reject ${testData.title}`,
        async ({ request }) => {
          const response =
            await request.post(
              `${BASE_URL}/users`,
              {
                data: testData.payload,
              }
            );

          expect(
            response.status()
          ).toBe(400);

          const body =
            await response.json();

          expect(body.error).toBe(
            "VALIDATION_ERROR"
          );

          expect(body.message).toBe(
            testData.expectedMessage
          );

          expect(
            db.getUserCount()
          ).toBe(0);
        }
      );
    }

    test(
      "Reject non-numeric user ID",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/users/abc`,
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
      }
    );

    test(
      "Reject zero user ID",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/users/0`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
            }
          );

        expect(response.status()).toBe(400);
      }
    );

    test(
      "Reject negative user ID",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/users/-10`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
            }
          );

        expect(response.status()).toBe(400);
      }
    );

    test(
      "Return 404 for user that does not exist",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/users/999999`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,
              },
            }
          );

        expect(response.status()).toBe(404);

        const body =
          await response.json();

        expect(body.error).toBe(
          "USER_NOT_FOUND"
        );

        expect(body.message).toBe(
          "User not found"
        );
      }
    );

    test(
      "Reject duplicate email",
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

        const body =
          await secondResponse.json();

        expect(body.error).toBe(
          "DUPLICATE_EMAIL"
        );

        expect(
          db.getUserCount()
        ).toBe(1);
      }
    );

    test(
      "Reject malformed JSON body",
      async ({ request }) => {
        const response =
          await request.post(
            `${BASE_URL}/users`,
            {
              headers: {
                "Content-Type":
                  "application/json",
              },

              // Raw malformed JSON.
              data: '{"name":"Dhruv",',
            }
          );

        expect(response.status()).toBe(400);

        const body =
          await response.json();

        expect(body.error).toBe(
          "INVALID_JSON"
        );
      }
    );

    test(
      "Unknown endpoint should return 404",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/unknown-endpoint`
          );

        expect(response.status()).toBe(404);

        const body =
          await response.json();

        expect(body.error).toBe(
          "ENDPOINT_NOT_FOUND"
        );
      }
    );
  }
);