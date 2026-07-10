import { APIResponse } from "@playwright/test";

export interface TimedApiResult {
  response: APIResponse;
  durationMs: number;
}

export interface PerformanceSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  minimumMs: number;
  maximumMs: number;
  averageMs: number;
  p95Ms: number;
}

export async function measureApiCall(
  apiCall: () => Promise<APIResponse>
): Promise<TimedApiResult> {
  const startTime = performance.now();

  const response = await apiCall();

  const endTime = performance.now();

  return {
    response,
    durationMs: endTime - startTime,
  };
}

export function calculatePerformanceSummary(
  results: TimedApiResult[]
): PerformanceSummary {
  if (results.length === 0) {
    throw new Error("Cannot calculate performance for an empty result set.");
  }

  const durations = results
    .map((result) => result.durationMs)
    .sort((a, b) => a - b);

  const successfulRequests = results.filter((result) =>
    result.response.ok()
  ).length;

  const failedRequests = results.length - successfulRequests;

  const totalDuration = durations.reduce(
    (sum, duration) => sum + duration,
    0
  );

  const p95Index = Math.min(
    Math.ceil(durations.length * 0.95) - 1,
    durations.length - 1
  );

  return {
    totalRequests: results.length,
    successfulRequests,
    failedRequests,
    minimumMs: durations[0],
    maximumMs: durations[durations.length - 1],
    averageMs: totalDuration / durations.length,
    p95Ms: durations[p95Index],
  };
}