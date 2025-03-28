/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `DefaultUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DefaultUser_email_key" ON "DefaultUser"("email");
