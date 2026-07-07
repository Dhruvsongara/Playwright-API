import { test, expect, APIRequestContext } from "@playwright/test";

const BASE_URL = "https://petstore.swagger.io/v2";

function createPetPayload() {
  return {
    id: Date.now(),
    category: {
      id: 1,
      name: "Dogs",
    },
    name: `Tommy-${Date.now()}`,
    photoUrls: ["https://example.com/pet.png"],
    tags: [
      {
        id: 1,
        name: "friendly",
      },
    ],
    status: "available",
  };
}

test.describe("Swagger Petstore API Testing Practice", () => {

  let petId: number;

  test("CRUD operation with API chaining", async ({ request }) => {


    // CREATE PET - POST
    const petPayload = createPetPayload();

    const createResponse = await request.post(`${BASE_URL}/pet`, {
      data: petPayload,
    });

    expect(createResponse.status()).toBe(200);
    expect(createResponse.ok()).toBeTruthy();

    const createBody = await createResponse.json();
    petId = createBody.id;

    expect(createBody.id).toBe(petPayload.id);
    expect(createBody.name).toBe(petPayload.name);
    expect(createBody.status).toBe("available");



    // READ PET - GET
    const getResponse = await request.get(`${BASE_URL}/pet/${petId}`);
    expect(getResponse.status()).toBe(200);

    const getBody = await getResponse.json();

    expect(getBody.id).toBe(petId);
    expect(getBody.name).toBe(petPayload.name);



    // UPDATE PET - PUT
    const updatedPayload = {
      ...petPayload,
      status: "sold",
      name: "Updated Tommy",
    };

    const updateResponse = await request.put(`${BASE_URL}/pet`, {
      data: updatedPayload,
    });
    expect(updateResponse.status()).toBe(200);

    const updateBody = await updateResponse.json();

    expect(updateBody.id).toBe(petId);
    expect(updateBody.name).toBe("Updated Tommy");
    expect(updateBody.status).toBe("sold");

    // DELETE PET - DELETE
    const deleteResponse = await request.delete(`${BASE_URL}/pet/${petId}`, {
      headers: {
        api_key: "special-key",
      },
    });

    expect(deleteResponse.status()).toBe(200);

    // VERIFY DELETED PET
    const verifyDeleteResponse = await request.get(`${BASE_URL}/pet/${petId}`);
    expect(verifyDeleteResponse.status()).toBe(404);

  });


  //JSON parsing practice
  test("JSON parsing practice", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: {
        status: "available",
      },
    });

    expect(response.status()).toBe(200);

    const pets = await response.json();

    expect(Array.isArray(pets)).toBeTruthy();

    const firstPet = pets[0];

    console.log("Pet ID:", firstPet.id);
    console.log("Pet Name:", firstPet.name);
    console.log("Pet Status:", firstPet.status);

    expect(firstPet).toHaveProperty("id");
    expect(firstPet).toHaveProperty("status");
  });

  //Dynamic data handling practice 
  test("Dynamic data handling practice", async ({ request }) => {
    const uniquePetId = Date.now();
    const uniquePetName = `Pet-${uniquePetId}`;

    const response = await request.post(`${BASE_URL}/pet`, {
      data: {
        id: uniquePetId,
        name: uniquePetName,
        photoUrls: ["https://example.com/image.png"],
        status: "available",
      },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.id).toBe(uniquePetId);
    expect(body.name).toBe(uniquePetName);
  });


  //header validation
  test("Header validation practice", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: {
        status: "available",
      },
    });
    expect(response.status()).toBe(200);

    const headers = response.headers();

    console.log(headers);
    expect(headers["content-type"]).toContain("application/json");
  });

  //Assertion practice 
  
  test("Assertions practice", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/pet/findByStatus`, {
      params: {
        status: "available",
      },
    });

    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);

    for (const pet of body.slice(0, 5)) {
      expect(pet).toHaveProperty("id");
      expect(pet).toHaveProperty("status");
    }
  });
});