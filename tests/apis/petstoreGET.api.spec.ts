import {test, expect} from "@playwright/test";

const BASE_URL = "https://petstore.swagger.io/v2";

test("get pets by status", async ({request})=>{

    const response = await request.get(`${BASE_URL}/pet/findByStatus`,{
        params: {
            status: "available",
        },
    });

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy;
    expect(body.length).toBeGreaterThan(0);

    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("name");
    expect(body[0]).toHaveProperty("status");
});
