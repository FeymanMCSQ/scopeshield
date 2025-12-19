/*
  Warnings:

  - Made the column `publicId` on table `ChangeRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ChangeRequest" ALTER COLUMN "publicId" SET NOT NULL;
