import {test, expect} from "@playwright/test";
import {z} from "zod";

const BASE_URL = "https://petstore.swagger.io/v2";

const petSchema = z.object({

    id:z.number(),
    name:z.string().optional(),
    photoUrls: z.array(z.string()).optional(),
    status: z.enum(["available","pending","sold"]).optional(),
});

test("schema validation using zod", async ({request})=>{

    const response = await request.get(`${BASE_URL}/pet/findByStatus`,{
        params: {
            status:"available"
        },
    })
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body)).toBeTruthy();

    for(const pet of body.slice(0,5)){
        const result = petSchema.safeParse(pet);
        expect(result.success).toBeTruthy();
    }
});