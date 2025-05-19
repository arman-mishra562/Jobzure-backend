/*
  Warnings:

  - You are about to drop the column `firstName` on the `PersonalDetails` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `PersonalDetails` table. All the data in the column will be lost.
  - Added the required column `full_name` to the `PersonalDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestedRoles` to the `PersonalDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intrstdIndstries` to the `PersonalDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salaryExp` to the `PersonalDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visaSponsor` to the `PersonalDetails` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "interestedRoles" AS ENUM ('Full_Stack_Developer', 'Frontend_Developer', 'Backend_Developer');

-- CreateEnum
CREATE TYPE "intrstdIndstries" AS ENUM ('IT_SOFTWARE', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'RETAIL', 'MANUFACTURING', 'CONSULTING', 'MEDIA', 'REAL_ESTATE');

-- AlterTable
ALTER TABLE "PersonalDetails" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "interestedRoles" "interestedRoles" NOT NULL,
ADD COLUMN     "intrstdIndstries" "intrstdIndstries" NOT NULL,
ADD COLUMN     "salaryExp" INTEGER NOT NULL,
ADD COLUMN     "visaSponsor" BOOLEAN NOT NULL;
