import {test, expect} from "@playwright/test";

const BASE_URL = "https://petstore.swagger.io/v2";

test("DELETE pet using api_key header", async ({ request }) => {
  const petId = Date.now();

  await request.post(`${BASE_URL}/pet`, {
    data: {
      id: petId,
      name: "DeleteMe",
      photoUrls: ["https://example.com/delete.png"],
      status: "available",
    },
  });

  const response = await request.delete(`${BASE_URL}/pet/${petId}`, {
    headers: {
      api_key: "special-key",
    },
    
  });

  expect(response.status()).toBe(200);
});