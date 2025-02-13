/*
  Warnings:

  - A unique constraint covering the columns `[wallet_address]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_address_key" ON "user"("wallet_address");
