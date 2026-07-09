import { APIRequestContext, expect } from "@playwright/test";

const BASE_URL = "https://dummyjson.com";

export class AuthApi {
  constructor(private request: APIRequestContext) {}

  async login(username: string, password: string) {
    const response = await this.request.post(`${BASE_URL}/auth/login`, {
      data: {
        username,
        password,
        expiresInMins: 30,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.accessToken).toBeTruthy();

    return body.accessToken;
  }

  async loginInvalid(username: string, password: string) {
    return await this.request.post(`${BASE_URL}/auth/login`, {
      data: {
        username,
        password,
      },
    });
  }
}