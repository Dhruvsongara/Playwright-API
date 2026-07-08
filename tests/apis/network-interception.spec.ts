import { test, expect } from "@playwright/test";

test("Network interception mock API response", async ({ page }) => {
  await page.route("**/v2/pet/findByStatus?status=available", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 101,
          name: "Mock Pet",
          status: "available",
        },
      ]),
    });
  });

  const response = await page.request.get(
    "https://petstore.swagger.io/v2/pet/findByStatus?status=available"
  );

  expect(response.status()).toBe(200);

  const body = await response.json();

//   console.log(body);

//   expect(body[0].name).toBe("doggie");
});

test("network interception for unicorstore", async ({page})=>{

    await page.route("https://shop.unicornstore.in/", async (route)=>{

        await route.fulfill({
            status: 200,
        });
    });
});