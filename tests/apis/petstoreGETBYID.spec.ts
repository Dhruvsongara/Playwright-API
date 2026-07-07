import {test,expect} from "@playwright/test";

const BASE_URL = "https://petstore.swagger.io/v2";

test("GET pet by ID", async ({ request }) => {
  const petId = 9223372016900150000;

  await request.post(`${BASE_URL}/pet`, {
    data: {
      id: petId,
      name: "doggie",
      photoUrls: ["string"],
      status: "available",
    },
  });

  const response = await request.get(`${BASE_URL}/pet/${petId}`);

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.id).toBe(petId);
  expect(body.name).toBe("doggie");
});