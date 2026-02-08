import { db } from "@/lib/database";
import {
  user,
  attendant,
  attendanceRoom,
  attendanceRecord,
  studentClass,
  classTable,
  semester,
} from "@/lib/schema";
import { expect, Page, test } from "@playwright/test";
import { ethers } from "ethers";
import { FastifyInstance } from "fastify";
import { signInWithWallet } from "../helpers/signInHelper";
import { eq } from "drizzle-orm";
import { createMetaMaskController } from "../metamaskServer";

const adminWallet = ethers.Wallet.createRandom();
let server: FastifyInstance;

const [attendantWallet, attendantWallet2] = [
  ethers.Wallet.createRandom(),
  ethers.Wallet.createRandom(),
];
let admin: typeof user.$inferSelect;
let attendant1: typeof attendant.$inferSelect;
let attendant2: typeof attendant.$inferSelect;

test.beforeEach(async () => {
  // add admin wallet to database
  const [insertedAdmin] = await db
    .insert(user)
    .values({
      walletAddress: adminWallet.address,
      role: "ADMIN",
    })
    .returning();
  admin = insertedAdmin;

  // add attendant to database
  const [insertedAttendant1] = await db
    .insert(attendant)
    .values({
      firstName: "Test",
      lastName: "Attendant",
      uid: "1",
      admin: admin.id,
    })
    .returning();
  attendant1 = insertedAttendant1;

  // create attendant
  const [insertedAttendant2] = await db
    .insert(attendant)
    .values({
      firstName: "Test2",
      lastName: "Attendant2",
      uid: "2",
      admin: admin.id,
    })
    .returning();
  attendant2 = insertedAttendant2;
});

test.afterEach(async () => {
  await db.delete(studentClass);
  await db.delete(attendanceRecord);
  await db.delete(attendanceRoom);
  await db.delete(classTable);
  await db.delete(attendant);
  await db.delete(semester);
  await db.delete(user);

  await server?.close();
});

test.describe("room", () => {
  async function signInAndCreateRoom(page: Page) {
    const response = await createMetaMaskController();
    server = response.server;
    response.controller.setWallet(adminWallet);
    await signInWithWallet(page);

    const [room] = await db
      .insert(attendanceRoom)
      .values({
        alias: "Test Room",
        createdBy: admin.id,
      })
      .returning();
    return {
      room,
      controller: response.controller,
    };
  }

  test("take attendance without previous attendance", async ({
    page,
    context,
  }) => {
    const { room, controller } = await signInAndCreateRoom(page);

    // go to the room page
    await page.goto(`/attendance/${room.id}`);

    const qrCode = page.getByTestId("qr-code");
    await expect(qrCode).toBeVisible();

    // Wait for the new page to be created when clicking the QR code
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      qrCode.click(),
    ]);

    controller.setWallet(attendantWallet);
    // Wait for the new page to load
    await newPage.waitForLoadState();
    newPage.on("dialog", (dialog) => dialog.accept());

    // Continue the test using the new page
    await expect(newPage.getByTestId("take-attendance-page")).toBeVisible();

    await newPage.getByTestId("wallet-select").selectOption("MetaMask");

    // check select name
    const attendantSelect = newPage.getByTestId("attendant-select");
    await expect(attendantSelect).toBeVisible();

    // select the attendant
    await attendantSelect.selectOption("Test Attendant");

    // check take attendance button
    const takeAttendanceButton = newPage.getByTestId("take-attendance-button");
    await expect(takeAttendanceButton).toBeVisible();

    // select first attendant
    await attendantSelect.selectOption(attendant1.id.toString());
    // check take attendance button
    await takeAttendanceButton.click();

    // get attendance-taken-message
    const attendanceTakenMessage = newPage.getByTestId(
      "attendance-taken-message"
    );
    await expect(attendanceTakenMessage).toBeVisible();
  });

  test("should not be able to take attendance who already has attendance", async ({
    page,
    context,
  }) => {
    // update attendant 1 with wallet address
    await db
      .update(attendant)
      .set({ walletAddress: attendantWallet.address })
      .where(eq(attendant.id, attendant1.id));

    const { room, controller } = await signInAndCreateRoom(page);
    await db.insert(attendanceRecord).values({
      attendantId: attendant1.id,
      attendanceRoomId: room.id,
    });

    // go to the room page
    await page.goto(`/attendance/${room.id}`);

    const qrCode = page.getByTestId("qr-code");
    await expect(qrCode).toBeVisible();

    // Wait for the new page to be created when clicking the QR code
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      qrCode.click(),
    ]);

    controller.setWallet(attendantWallet);
    // Wait for the new page to load
    await newPage.waitForLoadState();
    newPage.on("dialog", (dialog) => dialog.accept());

    // Continue the test using the new page
    await expect(newPage.getByTestId("take-attendance-page")).toBeVisible();

    await newPage.getByTestId("wallet-select").selectOption("MetaMask");

    // get attendance-taken-message
    const attendanceTakenMessage = newPage.getByTestId(
      "attendance-taken-message"
    );
    await expect(attendanceTakenMessage).toBeVisible();
  });

  test("should be able to take attendance with previous attendance record", async ({
    page,
    context,
  }) => {
    // update attendant 1 with wallet address
    await db
      .update(attendant)
      .set({ walletAddress: attendantWallet.address })
      .where(eq(attendant.id, attendant1.id));

    const { room, controller } = await signInAndCreateRoom(page);

    // go to the room page
    await page.goto(`/attendance/${room.id}`);

    const qrCode = page.getByTestId("qr-code");
    await expect(qrCode).toBeVisible();

    // Wait for the new page to be created when clicking the QR code
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      qrCode.click(),
    ]);

    controller.setWallet(attendantWallet);

    // Wait for the new page to load
    await newPage.waitForLoadState();
    newPage.on("dialog", (dialog) => dialog.accept());

    // Continue the test using the new page
    await expect(newPage.getByTestId("take-attendance-page")).toBeVisible();
    await newPage.getByTestId("wallet-select").selectOption("MetaMask");

    // check take attendance button
    const takeAttendanceButton = newPage.getByTestId("take-attendance-button");
    await expect(takeAttendanceButton).toBeVisible();

    await takeAttendanceButton.click();

    // get attendance-taken-message
    console.log("attendance", attendantWallet.address);
    const attendanceTakenMessage = newPage.getByTestId(
      "attendance-taken-message"
    );
    await expect(attendanceTakenMessage).toBeVisible();
  });

  test("should be able to take attendance in multiple rooms with same wallet", async ({
    page,
    context,
  }) => {
    // update attendant 1 with wallet address
    await db
      .update(attendant)
      .set({ walletAddress: attendantWallet.address })
      .where(eq(attendant.id, attendant1.id));

    // Create first room and take attendance
    const { room: room1, controller } = await signInAndCreateRoom(page);
    await db.insert(attendanceRecord).values({
      attendantId: attendant1.id,
      attendanceRoomId: room1.id,
    });

    // Create second room
    const [room2] = await db
      .insert(attendanceRoom)
      .values({
        alias: "Test Room 2",
        createdBy: admin.id,
      })
      .returning();

    // Go to the second room page
    await page.goto(`/attendance/${room2.id}`);

    const qrCode = page.getByTestId("qr-code");
    await expect(qrCode).toBeVisible();

    // Wait for the new page to be created when clicking the QR code
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      qrCode.click(),
    ]);

    controller.setWallet(attendantWallet);
    // Wait for the new page to load
    await newPage.waitForLoadState();
    newPage.on("dialog", (dialog) => dialog.accept());

    // Continue the test using the new page
    await expect(newPage.getByTestId("take-attendance-page")).toBeVisible();

    await newPage.getByTestId("wallet-select").selectOption("MetaMask");

    // The user should be able to take attendance in the second room
    // even though they already have a wallet registered and attendance in the first room
    const takeAttendanceButton = newPage.getByTestId("take-attendance-button");
    await expect(takeAttendanceButton).toBeVisible();

    await takeAttendanceButton.click();

    // Verify attendance was taken successfully
    const attendanceTakenMessage = newPage.getByTestId(
      "attendance-taken-message"
    );
    await expect(attendanceTakenMessage).toBeVisible();

    // Verify that attendance records exist in both rooms
    const records = await db.query.attendanceRecord.findMany({
      where: eq(attendanceRecord.attendantId, attendant1.id),
    });

    expect(records.length).toBe(2);
    expect(
      records.some((record) => record.attendanceRoomId === room1.id)
    ).toBeTruthy();
    expect(
      records.some((record) => record.attendanceRoomId === room2.id)
    ).toBeTruthy();
  });
});
