import { APIRequestContext, APIResponse, expect } from "@playwright/test";

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async getWithRetry(
    url: string,
    options = {},
    retries = 3
  ): Promise<APIResponse> {
    let lastResponse: APIResponse | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const response = await this.request.get(url, options);
      lastResponse = response;

      if (response.status() >= 200 && response.status() < 500) {
        return response;
      }

      console.log(`Retry attempt ${attempt}, status: ${response.status()}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return lastResponse!;
  }

  async validateStatus(response: APIResponse, expectedStatus: number) {
    expect(response.status()).toBe(expectedStatus);
  }

  async parseJson(response: APIResponse) {
    try {
      return await response.json();
    } catch {
      throw new Error("Response is not valid JSON");
    }
  }
}