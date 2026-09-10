/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value.
  - Existing rows need a temporary value before the column is made NOT NULL.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT;

UPDATE "User"
SET "password" = 'temporary-password'
WHERE "password" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "password" SET NOT NULL;
