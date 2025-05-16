-- CreateEnum
CREATE TYPE "CountryResident" AS ENUM ('USA', 'CANADA', 'UK', 'AUSTRALIA', 'FRANCE', 'GERMANY', 'ITALY');

-- CreateEnum
CREATE TYPE "targetJobLocation" AS ENUM ('USA', 'CANADA', 'UK', 'AUSTRALIA', 'FRANCE', 'GERMANY', 'ITALY', 'SWITZERLAND', 'JAPAN', 'CHINA', 'POLAND', 'BELGIUM', 'AUSTRIA', 'IRELAND', 'NEWZEALAND', 'PORTUGAL', 'FINLAND', 'NORWAY', 'Remote');

-- CreateTable
CREATE TABLE "PersonalDetails" (
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "personalEmail" TEXT NOT NULL,
    "countryResident" "CountryResident" NOT NULL,
    "targetJobLocation" "targetJobLocation" NOT NULL,
    "workAuthorization" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalDetails_userId_key" ON "PersonalDetails"("userId");

-- AddForeignKey
ALTER TABLE "PersonalDetails" ADD CONSTRAINT "PersonalDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
