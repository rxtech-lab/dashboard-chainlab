-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "attendance_room" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alias" TEXT NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "attendance_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_record" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendant_id" INTEGER NOT NULL,
    "attendance_room_id" INTEGER NOT NULL,

    CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendant" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "admin" INTEGER,
    "wallet_address" TEXT,

    CONSTRAINT "attendant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wallet_address" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendant_uid_key" ON "attendant"("uid");

-- AddForeignKey
ALTER TABLE "attendance_room" ADD CONSTRAINT "attendance_room_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_attendant_id_fkey" FOREIGN KEY ("attendant_id") REFERENCES "attendant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_record" ADD CONSTRAINT "attendance_record_attendance_room_id_fkey" FOREIGN KEY ("attendance_room_id") REFERENCES "attendance_room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendant" ADD CONSTRAINT "attendant_admin_fkey" FOREIGN KEY ("admin") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
