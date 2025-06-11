/*
  Warnings:

  - You are about to drop the `_InterestedIndustryToPersonalDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_InterestedRoleToPersonalDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PersonalDetailsToTargetJobLocation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InterestedIndustryToPersonalDetails" DROP CONSTRAINT "_InterestedIndustryToPersonalDetails_A_fkey";

-- DropForeignKey
ALTER TABLE "_InterestedIndustryToPersonalDetails" DROP CONSTRAINT "_InterestedIndustryToPersonalDetails_B_fkey";

-- DropForeignKey
ALTER TABLE "_InterestedRoleToPersonalDetails" DROP CONSTRAINT "_InterestedRoleToPersonalDetails_A_fkey";

-- DropForeignKey
ALTER TABLE "_InterestedRoleToPersonalDetails" DROP CONSTRAINT "_InterestedRoleToPersonalDetails_B_fkey";

-- DropForeignKey
ALTER TABLE "_PersonalDetailsToTargetJobLocation" DROP CONSTRAINT "_PersonalDetailsToTargetJobLocation_A_fkey";

-- DropForeignKey
ALTER TABLE "_PersonalDetailsToTargetJobLocation" DROP CONSTRAINT "_PersonalDetailsToTargetJobLocation_B_fkey";

-- DropTable
DROP TABLE "_InterestedIndustryToPersonalDetails";

-- DropTable
DROP TABLE "_InterestedRoleToPersonalDetails";

-- DropTable
DROP TABLE "_PersonalDetailsToTargetJobLocation";

-- CreateTable
CREATE TABLE "_JobLocations" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobLocations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Roles" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Roles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Industries" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Industries_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_JobLocations_B_index" ON "_JobLocations"("B");

-- CreateIndex
CREATE INDEX "_Roles_B_index" ON "_Roles"("B");

-- CreateIndex
CREATE INDEX "_Industries_B_index" ON "_Industries"("B");

-- AddForeignKey
ALTER TABLE "_JobLocations" ADD CONSTRAINT "_JobLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "PersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobLocations" ADD CONSTRAINT "_JobLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "TargetJobLocation"("value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Roles" ADD CONSTRAINT "_Roles_A_fkey" FOREIGN KEY ("A") REFERENCES "InterestedRole"("value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Roles" ADD CONSTRAINT "_Roles_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Industries" ADD CONSTRAINT "_Industries_A_fkey" FOREIGN KEY ("A") REFERENCES "InterestedIndustry"("value") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Industries" ADD CONSTRAINT "_Industries_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
