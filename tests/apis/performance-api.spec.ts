import { test, expect } from "@playwright/test";
import {
  calculatePerformanceSummary,
  measureApiCall,
} from "../../utils/performanceHelper";

const BASE_URL = "https://dummyjson.com";

test.describe("DummyJSON API performance validation", () => {
  test("Users API should respond successfully", async ({ request }) => {
    const result = await measureApiCall(() =>
      request.get(`${BASE_URL}/users`, {
        params: {
          limit: 10,
        },
      })
    );

    console.log(
      `GET /users response time: ${result.durationMs.toFixed(2)} ms`
    );

    expect(result.response.status()).toBe(200);

    // Suitable only as a loose public-API learning threshold.
    expect(result.durationMs).toBeLessThan(15_000);
  });

  test("Measure five concurrent user requests", async ({ request }) => {
    const userIds = [1, 2, 3, 4, 5];

    const results = await Promise.all(
      userIds.map((userId) =>
        measureApiCall(() =>
          request.get(`${BASE_URL}/users/${userId}`)
        )
      )
    );

    const summary = calculatePerformanceSummary(results);

    console.table({
      "Total requests": summary.totalRequests,
      Successful: summary.successfulRequests,
      Failed: summary.failedRequests,
      "Minimum ms": summary.minimumMs.toFixed(2),
      "Maximum ms": summary.maximumMs.toFixed(2),
      "Average ms": summary.averageMs.toFixed(2),
      "P95 ms": summary.p95Ms.toFixed(2),
    });

    expect(summary.totalRequests).toBe(5);
    expect(summary.successfulRequests).toBe(5);
    expect(summary.failedRequests).toBe(0);

    expect(summary.averageMs).toBeLessThan(20_000);
    expect(summary.p95Ms).toBeLessThan(30_000);
  });

  test("Detect a deliberately delayed response", async ({ request }) => {
    const result = await measureApiCall(() =>
      request.get(`${BASE_URL}/users`, {
        params: {
          delay: 2000,
          limit: 1,
        },
      })
    );

    console.log(
      `Delayed response time: ${result.durationMs.toFixed(2)} ms`
    );

    expect(result.response.status()).toBe(200);

    // Confirm the delay was actually applied.
    expect(result.durationMs).toBeGreaterThanOrEqual(1_800);

    // Prevent an unlimited wait.
    expect(result.durationMs).toBeLessThan(15_000);
  });
});