import { APIResponse } from "@playwright/test";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

export interface RetryResult {
  response: APIResponse;
  attempts: number;
}

const DEFAULT_RETRYABLE_STATUS_CODES = [
  408,
  429,
  500,
  502,
  503,
  504,
];

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function getRetryAfterMs(response: APIResponse): number | null {
  const retryAfter = response.headers()["retry-after"];

  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);

  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const retryDate = Date.parse(retryAfter);

  if (!Number.isNaN(retryDate)) {
    return Math.max(retryDate - Date.now(), 0);
  }

  return null;
}

function isNonRetryableProgrammingError(error: unknown): boolean {
  const message = String(error);

  return (
    message.includes("Invalid URL") ||
    message.includes("Invalid protocol") ||
    message.includes("unsupported protocol")
  );
}

export async function executeWithRetry(
  apiCall: () => Promise<APIResponse>,
  options: RetryOptions = {}
): Promise<RetryResult> {
  const {
    maxAttempts = 3,
    initialDelayMs = 500,
    backoffMultiplier = 2,
    retryableStatusCodes = DEFAULT_RETRYABLE_STATUS_CODES,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await apiCall();
      const status = response.status();

      const shouldRetry = retryableStatusCodes.includes(status);

      if (!shouldRetry) {
        return {
          response,
          attempts: attempt,
        };
      }

      if (attempt === maxAttempts) {
        return {
          response,
          attempts: attempt,
        };
      }

      const retryAfterMs = getRetryAfterMs(response);

      const exponentialDelay =
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);

      const delayMs = retryAfterMs ?? exponentialDelay;

      console.log(
        `Attempt ${attempt} returned ${status}. ` +
          `Retrying after ${delayMs} ms.`
      );

      await sleep(delayMs);
    } catch (error) {
      lastError = error;

      // Invalid URL is a coding/configuration problem.
      // Retrying will never solve it.
      if (isNonRetryableProgrammingError(error)) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw new Error(
          `API request failed after ${maxAttempts} attempts. ` +
            `Last error: ${String(lastError)}`
        );
      }

      const delayMs =
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);

      console.log(
        `Attempt ${attempt} failed with a network error. ` +
          `Retrying after ${delayMs} ms.`
      );

      await sleep(delayMs);
    }
  }

  throw new Error(
    `Unexpected retry failure. Last error: ${String(lastError)}`
  );
}