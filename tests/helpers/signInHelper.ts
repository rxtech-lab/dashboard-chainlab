import { ethers, HDNodeWallet } from "ethers";
import { Page } from "@playwright/test";
import { setupMockMetamaskWithPrivateKey } from "../mockMetamask";
import { FastifyInstance } from "fastify";

export async function signInWithWallet(
  page: Page,
  wallet: HDNodeWallet
): Promise<FastifyInstance> {
  const result = await setupMockMetamaskWithPrivateKey(wallet);
  const server = result.server;

  await page.goto("/");
  await page.waitForTimeout(2000);

  const button = page.getByTestId("provider-MetaMask-connect-button").first();
  await button.click();
  await page.waitForTimeout(2000);

  return server;
}
