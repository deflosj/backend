-- CreateTable
CREATE TABLE "RegistrationCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,

    CONSTRAINT "RegistrationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationCode_code_key" ON "RegistrationCode"("code");

-- CreateIndex
CREATE INDEX "RegistrationCode_createdById_idx" ON "RegistrationCode"("createdById");

-- AddForeignKey
ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
