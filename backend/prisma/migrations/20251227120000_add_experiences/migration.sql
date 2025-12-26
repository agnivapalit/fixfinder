-- Add experiences column to TechnicianProfile
ALTER TABLE "TechnicianProfile" ADD COLUMN "experiences" TEXT NOT NULL DEFAULT '[]';
