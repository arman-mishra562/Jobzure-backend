/*
  Warnings:

  - You are about to drop the column `codeExpiration` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `Admin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "codeExpiration",
DROP COLUMN "verificationCode",
ADD COLUMN     "tokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;
