/*
  Warnings:

  - Added the required column `superAdminId` to the `Admin` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- Create a default super admin
INSERT INTO "SuperAdmin" ("id", "email", "name", "password", "isVerified", "createdAt", "updatedAt")
VALUES (
    'default-super-admin',
    'superadmin@jobzure.com',
    'Default Super Admin',
    '$2a$10$defaultpasswordhash', -- This should be changed after first login
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "superAdminId" TEXT NOT NULL DEFAULT 'default-super-admin';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "assignedAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove the default value after adding the foreign key
ALTER TABLE "Admin" ALTER COLUMN "superAdminId" DROP DEFAULT;
