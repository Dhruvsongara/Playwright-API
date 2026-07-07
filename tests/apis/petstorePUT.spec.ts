import {test,expect} from "@playwright/test";

const BASE_URL = "https://petstore.swagger.io/v2";

test("PUT update pet status", async ({ request }) => {
  const petId = Date.now();

  await request.post(`${BASE_URL}/pet`, {
    data: {
      id: petId,
      name: "Bruno",
      photoUrls: ["https://example.com/bruno.png"],
      status: "available",
    },
  });

  const response = await request.put(`${BASE_URL}/pet`, {
    data: {
      id: petId,
      name: "Bruno",
      photoUrls: ["https://example.com/bruno.png"],
      status: "sold",
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.id).toBe(petId);
  expect(body.status).toBe("sold");
});