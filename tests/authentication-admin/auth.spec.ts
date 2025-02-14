import { prisma } from "@/lib/database";
import { expect, test } from "@playwright/test";
import { ethers } from "ethers";
import { setupMockMetamaskWithPrivateKey } from "../mockMetamask";
import { FastifyInstance } from "fastify";
import { signInWithWallet } from "../helpers/signInHelper";

const adminWallet = ethers.Wallet.createRandom();
let server: FastifyInstance;

const [attendantWallet, attendantWallet2, attendantWallet3, attendantWallet4] =
  [
    ethers.Wallet.createRandom(),
    ethers.Wallet.createRandom(),
    ethers.Wallet.createRandom(),
    ethers.Wallet.createRandom(),
  ];

test.beforeEach(async () => {
  // add admin wallet to database
  await prisma.user.create({
    data: {
      walletAddress: adminWallet.address,
      role: "ADMIN",
    },
  });

  // add attendant wallet to database
  await prisma.user.create({
    data: {
      walletAddress: attendantWallet.address,
      role: "USER",
    },
  });
});

test.afterEach(async () => {
  await prisma.user.deleteMany();
  await server.close();
});

test("sign in with correct credentials and role", async ({ page }) => {
  server = await signInWithWallet(page, adminWallet);

  // check if the button is not visible
  const button = page.getByTestId("provider-MetaMask-connect-button").first();
  await expect(button).not.toBeVisible();
});

test("sign in with correct credentials and incorrect role", async ({
  page,
}) => {
  server = await signInWithWallet(page, attendantWallet);

  // check if the button is visible
  const button = page.getByTestId("provider-MetaMask-connect-button").first();
  await expect(button).toBeVisible();

  // check if the attendance rooms list is not visible
  const attendanceRoomsList = page.getByTestId("attendance-rooms-list");
  await expect(attendanceRoomsList).not.toBeVisible();
});

test("sign in with incorrect credentials", async ({ page }) => {
  server = await signInWithWallet(page, attendantWallet2);

  // check if the button is visible
  const button = page.getByTestId("provider-MetaMask-connect-button").first();
  await expect(button).toBeVisible();

  // check if the attendance rooms list is not visible
  const attendanceRoomsList = page.getByTestId("attendance-rooms-list");
  await expect(attendanceRoomsList).not.toBeVisible();
});
