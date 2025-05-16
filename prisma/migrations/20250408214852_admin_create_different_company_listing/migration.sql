-- CreateTable
CREATE TABLE "CompanyListing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "companyLocation" TEXT NOT NULL,
    "targetIndustry" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyListing_name_key" ON "CompanyListing"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyListing_registrationNumber_key" ON "CompanyListing"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyListing_adminId_key" ON "CompanyListing"("adminId");

-- AddForeignKey
ALTER TABLE "CompanyListing" ADD CONSTRAINT "CompanyListing_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
