import {
  test,
  expect,
} from "@playwright/test";

const BASE_URL =
  "http://127.0.0.1:3001";

const VALID_TOKEN =
  "practice-secret-token";

test.describe(
  "API monitoring and observability",
  () => {
    test(
      "Health endpoint should report service as UP",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/health`
          );

        expect(response.status()).toBe(200);

        const body =
          await response.json();

        expect(body.status).toBe("UP");

        expect(body.service).toBe(
          "users-api"
        );

        expect(body.timestamp).toBeTruthy();

        const timestamp =
          new Date(body.timestamp);

        expect(
          timestamp.toString()
        ).not.toBe("Invalid Date");
      }
    );

    test(
      "Response should contain generated request ID",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/health`
          );

        expect(response.status()).toBe(200);

        const headers =
          response.headers();

        const requestId =
          headers["x-request-id"];

        expect(requestId).toBeTruthy();

        console.log(
          "Generated request ID:",
          requestId
        );
      }
    );

    test(
      "API should preserve supplied correlation ID",
      async ({ request }) => {
        const correlationId =
          `playwright-${Date.now()}`;

        const response =
          await request.get(
            `${BASE_URL}/health`,
            {
              headers: {
                "x-request-id":
                  correlationId,
              },
            }
          );

        expect(response.status()).toBe(200);

        const responseRequestId =
          response.headers()[
            "x-request-id"
          ];

        expect(responseRequestId).toBe(
          correlationId
        );
      }
    );

    test(
      "Health endpoint response time should be acceptable",
      async ({ request }) => {
        const startTime =
          performance.now();

        const response =
          await request.get(
            `${BASE_URL}/health`
          );

        const endTime =
          performance.now();

        const durationMs =
          endTime - startTime;

        console.log(
          `Health API response time: ${durationMs.toFixed(
            2
          )} ms`
        );

        expect(response.status()).toBe(200);

        // This is a local learning threshold.
        expect(durationMs).toBeLessThan(
          1000
        );
      }
    );

    test(
      "Error response should include correlation ID",
      async ({ request }) => {
        const requestId =
          `negative-${Date.now()}`;

        const response =
          await request.get(
            `${BASE_URL}/users/invalid-id`,
            {
              headers: {
                Authorization:
                  `Bearer ${VALID_TOKEN}`,

                "x-request-id":
                  requestId,
              },
            }
          );

        expect(response.status()).toBe(400);

        expect(
          response.headers()[
            "x-request-id"
          ]
        ).toBe(requestId);

        const body =
          await response.json();

        expect(body.error).toBe(
          "INVALID_ID"
        );

        expect(body.message).toBeTruthy();
      }
    );

    test(
      "Successful API response should have consistent JSON content type",
      async ({ request }) => {
        const response =
          await request.get(
            `${BASE_URL}/health`
          );

        expect(response.status()).toBe(200);

        const contentType =
          response.headers()[
            "content-type"
          ];

        expect(contentType).toContain(
          "application/json"
        );
      }
    );

    test(
      "Unknown endpoint error should remain observable",
      async ({ request }) => {
        const requestId =
          `unknown-${Date.now()}`;

        const response =
          await request.get(
            `${BASE_URL}/unknown`,
            {
              headers: {
                "x-request-id":
                  requestId,
              },
            }
          );

        expect(response.status()).toBe(404);

        expect(
          response.headers()[
            "x-request-id"
          ]
        ).toBe(requestId);

        const body =
          await response.json();

        expect(body.error).toBe(
          "ENDPOINT_NOT_FOUND"
        );
      }
    );
  }
);