-- CreateTable
CREATE TABLE "ShiftGroup" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSlot" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "title" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "maxPersons" INTEGER,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "requiredRole" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRegistration" (
    "id" SERIAL NOT NULL,
    "slotId" INTEGER NOT NULL,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftGroup_eventId_idx" ON "ShiftGroup"("eventId");

-- CreateIndex
CREATE INDEX "ShiftSlot_groupId_idx" ON "ShiftSlot"("groupId");

-- CreateIndex
CREATE INDEX "ShiftRegistration_slotId_idx" ON "ShiftRegistration"("slotId");

-- CreateIndex
CREATE INDEX "ShiftRegistration_userId_idx" ON "ShiftRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftRegistration_slotId_email_key" ON "ShiftRegistration"("slotId", "email");

-- AddForeignKey
ALTER TABLE "ShiftGroup" ADD CONSTRAINT "ShiftGroup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSlot" ADD CONSTRAINT "ShiftSlot_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ShiftGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRegistration" ADD CONSTRAINT "ShiftRegistration_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ShiftSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRegistration" ADD CONSTRAINT "ShiftRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
