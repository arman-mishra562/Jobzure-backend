-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "codeExpiration" TIMESTAMP(3),
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationCode" VARCHAR(6);
