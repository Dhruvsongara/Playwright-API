import {test, expect} from "@playwright/test";

const BASE_URL = "https://petstore.swagger.io/v2";

test("create new pet", async ({request})=>{

    const petPayLoad = {
    "id": 0,
    "category": {
        "id": 0,
        "name": "string"
    },
    "name": "doggie",
    "photoUrls": [
        "string"
    ],
    "tags": [
        {
        "id": 0,
        "name": "string"
        }
    ],
    "status": "available"
    }

    const response = await request.post(`${BASE_URL}/pet`,{
        data: petPayLoad,
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBeGreaterThan(0);
    expect(body.name).toBe("doggie");
    expect(body.status).toBe("available");
});