// import {test, expect} from "@playwright/test";

// // test("Drag and drop practice", async ({page})=>{

// //     await page.goto("https://demoqa.com/droppable");
// //     const source = page.locator("#draggable");
// //     const target = page.locator("#droppable").first();

// //     await source.hover();
// //     await page.mouse.down();

// //     await page.waitForTimeout(2000);
// //     await target.hover();
// //     await page.waitForTimeout(2000);
// //     await page.mouse.up();
// //     await expect(page.locator("//div[@id='droppable']/p").first()).toHaveText("Dropped!");
// //     await page.pause();
// // });


// test("Drag and drop practice", async ({page})=>{

//     await page.goto("https://demoqa.com/droppable");
//     const source = page.locator("#draggable");
//     const target = page.locator("#droppable").first();

//     await source.hover();
//     await page.mouse.down();
//     await target.hover();
//     await page.mouse.up();
//     await expect(page.locator("//div[@id='droppable']/p").first()).toHaveText("Dropped!");
//     await page.pause();
// });
