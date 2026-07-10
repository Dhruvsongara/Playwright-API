import { test, expect } from "@playwright/test";
import {
  calculatePerformanceSummary,
  measureApiCall,
} from "../../utils/performanceHelper";
import { executeWithRetry } from "../../utils/retryHelper";

const BASE_URL = "https://dummyjson.com";

test.describe("Advanced API execution practice", () => {
  test("Parallel user requests with performance validation", async ({
    request,
  }) => {
    const userIds = [1, 2, 3, 4, 5];

    const results = await Promise.all(
      userIds.map((userId) =>
        measureApiCall(() =>
          request.get(`${BASE_URL}/users/${userId}`)
        )
      )
    );

    const summary = calculatePerformanceSummary(results);

    for (let index = 0; index < results.length; index++) {
      const response = results[index].response;
      const expectedUserId = userIds[index];

      expect(response.status()).toBe(200);

      const body = await response.json();

      expect(body.id).toBe(expectedUserId);
    }

    console.log({
      totalRequests: summary.totalRequests,
      successfulRequests: summary.successfulRequests,
      failedRequests: summary.failedRequests,
      averageMs: summary.averageMs,
      maximumMs: summary.maximumMs,
      p95Ms: summary.p95Ms,
    });

    expect(summary.successfulRequests).toBe(userIds.length);
    expect(summary.failedRequests).toBe(0);

    /*
     * DummyJSON is a public shared API.
     * Use a learning threshold rather than a strict production SLA.
     */
    expect(summary.averageMs).toBeLessThan(20_000);
    expect(summary.p95Ms).toBeLessThan(30_000);
  });

  test("Retry a transient service failure", async ({ request }) => {
    const message = encodeURIComponent("Service unavailable");

    const result = await executeWithRetry(
      () =>
        request.get(`${BASE_URL}/http/503/${message}`),
      {
        maxAttempts: 3,
        initialDelayMs: 200,
      }
    );

    expect(result.response.status()).toBe(503);
    expect(result.attempts).toBe(3);
  });

  test("Handle rate-limited response", async ({ request }) => {
    const message = encodeURIComponent("Too many requests");

    const result = await executeWithRetry(
      () =>
        request.get(`${BASE_URL}/http/429/${message}`),
      {
        maxAttempts: 3,
        initialDelayMs: 200,
      }
    );

    expect(result.response.status()).toBe(429);
    expect(result.attempts).toBe(3);
  });
});