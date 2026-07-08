import {test, expect} from "@playwright/test";

test("date picker practice", async ({page})=>{

    await page.goto("https://demoqa.com/date-picker");
    await page.locator("#datePickerMonthYearInput").click();
    await page.getByRole("gridcell", {name: "3"}).nth(1).click();
    await page.locator("#dateAndTimePickerInput").click();
    await page.getByRole("gridcell", {name: "3"}).nth(1).click();
    await page.getByRole("option", {name: "12:00"}).click();
});