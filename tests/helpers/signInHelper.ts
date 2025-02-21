import { Page } from "@playwright/test";
export async function signInWithWallet(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForTimeout(2000);

  const button = page.getByTestId("provider-MetaMask-connect-button").first();
  await button.click();
  await page.waitForTimeout(2000);
}
