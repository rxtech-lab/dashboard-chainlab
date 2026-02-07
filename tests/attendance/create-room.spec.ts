import { db } from "@/lib/db";
import { user as userTable, attendanceRoom as attendanceRoomTable } from "@/lib/db/schema";
import { expect, test } from "@playwright/test";
import { ethers } from "ethers";
import { FastifyInstance } from "fastify";
import { signInWithWallet } from "../helpers/signInHelper";
import { User } from "@/lib/auth";
import { createMetaMaskController } from "../metamaskServer";
const adminWallet = ethers.Wallet.createRandom();
let server: FastifyInstance;

const [attendantWallet] = [ethers.Wallet.createRandom()];
let admin: User;

test.beforeEach(async () => {
  // add admin wallet to database
  const result = await db.insert(userTable).values({
    walletAddress: adminWallet.address,
    role: "ADMIN",
  }).returning();
  admin = result[0];

  // add attendant wallet to database
  await db.insert(userTable).values({
    walletAddress: attendantWallet.address,
    role: "USER",
  });
});

test.afterEach(async () => {
  await db.delete(attendanceRoomTable);
  await db.delete(userTable);

  await server.close();
});

test.describe("room", () => {
  test("create a room", async ({ page }) => {
    const response = await createMetaMaskController();
    server = response.server;
    response.controller.setWallet(adminWallet);
    await signInWithWallet(page);

    // check if the button is not visible
    const button = page.getByTestId("provider-MetaMask-connect-button").first();
    await expect(button).not.toBeVisible();

    // create a room
    const createRoomButton = page.getByTestId("create-room-button");
    await expect(createRoomButton).toBeVisible();
    await createRoomButton.click();

    const createRoomInput = page.getByTestId("create-room-input");
    await createRoomInput.fill("Test Room");

    const confirmButton = page.getByTestId("confirm-button");
    await confirmButton.click();

    // check if the room is created
    const attendanceRoomCard = page.getByTestId("attendance-room-card");
    await expect(attendanceRoomCard).toBeVisible();
  });

  test("Update and delete a room", async ({ page }) => {
    const response = await createMetaMaskController();
    server = response.server;
    response.controller.setWallet(adminWallet);
    await signInWithWallet(page);

    // check if the button is not visible
    const button = page.getByTestId("provider-MetaMask-connect-button").first();
    await expect(button).not.toBeVisible();

    // create a room
    const createRoomButton = page.getByTestId("create-room-button");
    await createRoomButton.click();

    const createRoomInput = page.getByTestId("create-room-input");
    await createRoomInput.fill("Test Room");

    const confirmButton = page.getByTestId("confirm-button");
    await confirmButton.click();

    // check if the room is created
    const attendanceRoomCard = page.getByTestId("attendance-room-card");
    await expect(attendanceRoomCard).toBeVisible();

    // update the room
    const updateRoomButton = page.getByTestId("update-room-button");
    await updateRoomButton.click();

    const updateRoomInput = page.getByTestId("update-room-input");
    await updateRoomInput.fill("Updated Room");

    const updateConfirmButton = page.getByTestId("update-room-confirm-button");
    await updateConfirmButton.click();

    // check if the room is updated
    const updatedAttendanceRoomCard = page.getByTestId("attendance-room-card");
    await expect(updatedAttendanceRoomCard).toBeVisible();
    // check if the room name is updated
    await expect(page.getByText("Updated Room")).toBeVisible();

    // delete the room
    page.on("dialog", (dialog) => dialog.accept());
    const deleteRoomButton = page.getByTestId("delete-room-button");
    await deleteRoomButton.click();

    // check if the room is deleted
    await expect(attendanceRoomCard).not.toBeVisible();
  });
});

test.describe("pagination", () => {
  test("create a room", async ({ page }) => {
    // write 21 rooms in the database
    await db.insert(attendanceRoomTable).values(
      Array.from({ length: 21 }, (_, i) => ({
        alias: `Test Room ${i + 1}`,
        createdBy: admin.id,
      }))
    );

    const response = await createMetaMaskController();
    server = response.server;
    response.controller.setWallet(adminWallet);
    await signInWithWallet(page);

    // check if the button is not visible
    const button = page.getByTestId("provider-MetaMask-connect-button").first();
    await expect(button).not.toBeVisible();

    // check if the pagination has 3 pages
    expect(page.getByRole("link", { name: "1" })).toBeVisible();
    expect(page.getByRole("link", { name: "2" })).toBeVisible();
    expect(page.getByRole("link", { name: "3" })).toBeVisible();

    // go to the second page
    await page.getByRole("link", { name: "2" }).click();

    // check if the second page is visible
    const secondPageCard = await page.getByRole("heading", {
      name: "Test Room 11",
    });
    await expect(secondPageCard).toBeVisible();
  });
});
