import { prisma } from "@/lib/database";
import { expect, Page, test } from "@playwright/test";
import { ethers } from "ethers";
import { FastifyInstance } from "fastify";
import { signInWithWallet } from "../helpers/signInHelper";
import { User, Attendant } from "@prisma/client";
import { createMetaMaskController } from "../metamaskServer";
const adminWallet = ethers.Wallet.createRandom();
let server: FastifyInstance;

const [attendantWallet, attendantWallet2] = [
  ethers.Wallet.createRandom(),
  ethers.Wallet.createRandom(),
];
let admin: User;
let attendant: Attendant;
let attendant2: Attendant;

test.beforeEach(async () => {
  // add admin wallet to database
  admin = await prisma.user.create({
    data: {
      walletAddress: adminWallet.address,
      role: "ADMIN",
    },
  });

  // add attendant wallet to database
  attendant = await prisma.attendant.create({
    data: {
      firstName: "Test",
      lastName: "Attendant",
      uid: "1",
      adminUser: {
        connect: {
          id: admin.id,
        },
      },
    },
  });

  // create attendant
  attendant2 = await prisma.attendant.create({
    data: {
      firstName: "Test2",
      lastName: "Attendant2",
      uid: "2",
      adminUser: {
        connect: {
          id: admin.id,
        },
      },
    },
  });
});

test.afterEach(async () => {
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceRoom.deleteMany();
  await prisma.attendant.deleteMany();
  await prisma.user.deleteMany();

  await server?.close();
});

test.describe("room", () => {
  async function signInAndCreateRoom(page: Page) {
    const response = await createMetaMaskController();
    server = response.server;
    response.controller.setWallet(adminWallet);
    await signInWithWallet(page);

    const room = await prisma.attendanceRoom.create({
      data: {
        alias: "Test Room",
        createdBy: admin.id,
      },
    });
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
    await attendantSelect.selectOption(attendant.id.toString());
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
    await prisma.attendant.update({
      where: { id: attendant.id },
      data: { walletAddress: attendantWallet.address },
    });

    const { room, controller } = await signInAndCreateRoom(page);
    await prisma.attendanceRecord.create({
      data: {
        attendantId: attendant.id,
        attendanceRoomId: room.id,
      },
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
    await prisma.attendant.update({
      where: { id: attendant.id },
      data: { walletAddress: attendantWallet.address },
    });

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
});
