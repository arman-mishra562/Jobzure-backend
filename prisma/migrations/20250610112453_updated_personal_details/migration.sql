/*
  Warnings:

  - You are about to drop the column `interestedRoles` on the `PersonalDetails` table. All the data in the column will be lost.
  - You are about to drop the column `intrstdIndstries` on the `PersonalDetails` table. All the data in the column will be lost.
  - You are about to drop the column `targetJobLocation` on the `PersonalDetails` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'PENDING_INTERVIEW', 'HIRED');

-- AlterTable
ALTER TABLE "PersonalDetails" DROP COLUMN "interestedRoles",
DROP COLUMN "intrstdIndstries",
DROP COLUMN "targetJobLocation",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PersonalDetails_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "interestedRoles";

-- DropEnum
DROP TYPE "intrstdIndstries";

-- DropEnum
DROP TYPE "targetJobLocation";

-- CreateTable
CREATE TABLE "InterestedRole" (
    "value" TEXT NOT NULL,

    CONSTRAINT "InterestedRole_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "TargetJobLocation" (
    "value" TEXT NOT NULL,

    CONSTRAINT "TargetJobLocation_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "InterestedIndustry" (
    "value" TEXT NOT NULL,

    CONSTRAINT "InterestedIndustry_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "_PersonalDetailsToTargetJobLocation" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PersonalDetailsToTargetJobLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InterestedRoleToPersonalDetails" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InterestedRoleToPersonalDetails_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InterestedIndustryToPersonalDetails" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InterestedIndustryToPersonalDetails_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PersonalDetailsToTargetJobLocation_B_index" ON "_PersonalDetailsToTargetJobLocation"("B");

-- CreateIndex
CREATE INDEX "_InterestedRoleToPersonalDetails_B_index" ON "_InterestedRoleToPersonalDetails"("B");

-- CreateIndex
CREATE INDEX "_InterestedIndustryToPersonalDetails_B_index" ON "_InterestedIndustryToPersonalDetails"("B");

-- AddForeignKey
ALTER TABLE "_PersonalDetailsToTargetJobLocation" ADD CONSTRAINT "_PersonalDetailsToTargetJobLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "PersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalDetailsToTargetJobLocation" ADD CONSTRAINT "_PersonalDetailsToTargetJobLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "TargetJobLocation"("value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestedRoleToPersonalDetails" ADD CONSTRAINT "_InterestedRoleToPersonalDetails_A_fkey" FOREIGN KEY ("A") REFERENCES "InterestedRole"("value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestedRoleToPersonalDetails" ADD CONSTRAINT "_InterestedRoleToPersonalDetails_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestedIndustryToPersonalDetails" ADD CONSTRAINT "_InterestedIndustryToPersonalDetails_A_fkey" FOREIGN KEY ("A") REFERENCES "InterestedIndustry"("value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestedIndustryToPersonalDetails" ADD CONSTRAINT "_InterestedIndustryToPersonalDetails_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
