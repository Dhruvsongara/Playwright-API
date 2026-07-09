import { APIRequestContext } from "@playwright/test";

const BASE_URL = "https://dummyjson.com";

export class UserApi {
  constructor(private request: APIRequestContext) {}

  async getCurrentUser(token: string) {
    return await this.request.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getUserById(userId: number) {
    return await this.request.get(`${BASE_URL}/users/${userId}`);
  }

  async getUserByIdWithToken(userId: number, token: string) {
    return await this.request.get(`${BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}