/*
  Warnings:

  - You are about to drop the `CompanyListing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompanyListing" DROP CONSTRAINT "CompanyListing_adminId_fkey";

-- DropTable
DROP TABLE "CompanyListing";
