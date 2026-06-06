/*
  Warnings:

  - The values [GROUP,R16,R8,QUARTER,SEMI] on the enum `Phase` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `ContactMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdBy` on the `InviteToken` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `wielerclub` on the `Registration` table. All the data in the column will be lost.
  - The `dateOfBirth` column on the `Registration` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `usedCount` on the `RegistrationCode` table. All the data in the column will be lost.
  - You are about to drop the `TiebreakTeam` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[eventId,userId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nationalRegisterNumber]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slotId,userId]` on the table `ShiftRegistration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taskId,userId]` on the table `TaskAssignee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,name]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,year]` on the table `Tournament` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ContactMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MemberProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Poule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `Registration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Sponsor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tiebreaker` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterEnum
BEGIN;
CREATE TYPE "Phase_new" AS ENUM ('GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'CONSOLATION_FINAL', 'FINAL', 'TIEBREAK');
ALTER TABLE "public"."Match" ALTER COLUMN "phase" DROP DEFAULT;
ALTER TABLE "public"."Poule" ALTER COLUMN "phase" DROP DEFAULT;
ALTER TABLE "Poule" ALTER COLUMN "phase" TYPE "Phase_new" USING ("phase"::text::"Phase_new");
ALTER TABLE "Match" ALTER COLUMN "phase" TYPE "Phase_new" USING ("phase"::text::"Phase_new");
ALTER TYPE "Phase" RENAME TO "Phase_old";
ALTER TYPE "Phase_new" RENAME TO "Phase";
DROP TYPE "public"."Phase_old";
ALTER TABLE "Match" ALTER COLUMN "phase" SET DEFAULT 'GROUP_STAGE';
ALTER TABLE "Poule" ALTER COLUMN "phase" SET DEFAULT 'GROUP_STAGE';
COMMIT;

-- DropForeignKey
ALTER TABLE "InviteToken" DROP CONSTRAINT "InviteToken_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "TiebreakTeam" DROP CONSTRAINT "TiebreakTeam_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TiebreakTeam" DROP CONSTRAINT "TiebreakTeam_tiebreakId_fkey";

-- DropForeignKey
ALTER TABLE "Tiebreaker" DROP CONSTRAINT "Tiebreaker_tournamentId_fkey";

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'UNREAD';

-- AlterTable
ALTER TABLE "InviteToken" DROP COLUMN "createdBy",
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "time",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "phase" SET DEFAULT 'GROUP_STAGE';

-- AlterTable
ALTER TABLE "MemberProfile" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Poule" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "phase" SET DEFAULT 'GROUP_STAGE';

-- AlterTable
ALTER TABLE "Registration" DROP COLUMN "timestamp",
DROP COLUMN "wielerclub",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cyclingClub" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "dateOfBirth",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "RegistrationCode" DROP COLUMN "usedCount";

-- AlterTable
ALTER TABLE "RegistrationSettings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tiebreaker" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "TiebreakTeam";

-- DropEnum
DROP TYPE "MsgStatus";

-- CreateTable
CREATE TABLE "TiebreakerTeam" (
    "id" SERIAL NOT NULL,
    "tiebreakerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiebreakerTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentInviteCode" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedByTeamId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TiebreakerTeam_tiebreakerId_idx" ON "TiebreakerTeam"("tiebreakerId");

-- CreateIndex
CREATE INDEX "TiebreakerTeam_teamId_idx" ON "TiebreakerTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TiebreakerTeam_tiebreakerId_teamId_key" ON "TiebreakerTeam"("tiebreakerId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentInviteCode_code_key" ON "TournamentInviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentInviteCode_usedByTeamId_key" ON "TournamentInviteCode"("usedByTeamId");

-- CreateIndex
CREATE INDEX "TournamentInviteCode_tournamentId_idx" ON "TournamentInviteCode"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentInviteCode_createdById_idx" ON "TournamentInviteCode"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_eventId_userId_key" ON "Attendance"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_nationalRegisterNumber_key" ON "Registration"("nationalRegisterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftRegistration_slotId_userId_key" ON "ShiftRegistration"("slotId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tournamentId_name_key" ON "Team"("tournamentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_name_year_key" ON "Tournament"("name", "year");

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tiebreaker" ADD CONSTRAINT "Tiebreaker_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiebreakerTeam" ADD CONSTRAINT "TiebreakerTeam_tiebreakerId_fkey" FOREIGN KEY ("tiebreakerId") REFERENCES "Tiebreaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiebreakerTeam" ADD CONSTRAINT "TiebreakerTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentInviteCode" ADD CONSTRAINT "TournamentInviteCode_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentInviteCode" ADD CONSTRAINT "TournamentInviteCode_usedByTeamId_fkey" FOREIGN KEY ("usedByTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentInviteCode" ADD CONSTRAINT "TournamentInviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
