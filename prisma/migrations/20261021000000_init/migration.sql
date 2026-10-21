-- CreateEnum
CREATE TYPE "Role" AS ENUM ('caregiver', 'patient');

-- CreateEnum
CREATE TYPE "PrescriptionForm" AS ENUM ('tablet', 'capsule', 'syrup', 'drops', 'injection', 'cream', 'other');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('active', 'paused', 'finished');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "caregiverId" UUID,
    "birthDate" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "drugName" VARCHAR(100) NOT NULL,
    "dosage" VARCHAR(50) NOT NULL,
    "form" "PrescriptionForm" NOT NULL,
    "unitsPerDose" INTEGER NOT NULL,
    "scheduleDays" INTEGER[],
    "scheduleTimes" TEXT[],
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "instructions" VARCHAR(500) NOT NULL DEFAULT '',
    "missedAfterMinutes" INTEGER NOT NULL DEFAULT 60,
    "stockQuantity" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeLog" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "takenAt" TIMESTAMPTZ(3) NOT NULL,
    "unitsDeducted" INTEGER NOT NULL,
    "note" VARCHAR(200),

    CONSTRAINT "IntakeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_caregiverId_idx" ON "User"("caregiverId");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "IntakeLog_patientId_scheduledAt_idx" ON "IntakeLog"("patientId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeLog_prescriptionId_scheduledAt_key" ON "IntakeLog"("prescriptionId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data integrity checks (מעבר למה ש-Prisma יוצר)
ALTER TABLE "User" ADD CONSTRAINT "User_patient_has_caregiver_check"
    CHECK (("role" = 'patient' AND "caregiverId" IS NOT NULL) OR ("role" = 'caregiver' AND "caregiverId" IS NULL));
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_units_check" CHECK ("unitsPerDose" >= 1);
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_stock_check" CHECK ("stockQuantity" >= 0 AND "lowStockThreshold" >= 0);
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_dates_check" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_schedule_check"
    CHECK (cardinality("scheduleDays") >= 1 AND cardinality("scheduleTimes") >= 1);
ALTER TABLE "IntakeLog" ADD CONSTRAINT "IntakeLog_units_check" CHECK ("unitsDeducted" >= 0);
