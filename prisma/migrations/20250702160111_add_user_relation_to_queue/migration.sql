-- CreateTable
CREATE TABLE "UserAssignmentQueue" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAssignmentQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAssignmentQueue_userId_key" ON "UserAssignmentQueue"("userId");

-- AddForeignKey
ALTER TABLE "UserAssignmentQueue" ADD CONSTRAINT "UserAssignmentQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
