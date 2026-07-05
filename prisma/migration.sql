-- JurivonAI — Initial database schema
-- Run this in your Neon SQL editor (or any Postgres client) to create the tables.
-- Get your Neon project at https://neon.tech (free).

-- Drop if exists (safe to re-run during setup; will NOT delete data once rows exist)
-- Comment out the DROP line below if you're rerunning and want to preserve data.
-- DROP TABLE IF EXISTS "Response";

CREATE TABLE IF NOT EXISTS "Response" (
    "id"              TEXT         NOT NULL,
    "email"           TEXT         NOT NULL,
    "practiceArea"    TEXT,
    "city"            TEXT,
    "yearsOfPractice" TEXT,
    "barNumber"       TEXT,
    "started"         BOOLEAN      NOT NULL DEFAULT false,
    "completed"       BOOLEAN      NOT NULL DEFAULT false,
    "completedAt"     TIMESTAMP(3),
    "answers"         TEXT         NOT NULL DEFAULT '{}',
    "currentSection"  INTEGER      NOT NULL DEFAULT 1,
    "currentQuestion" INTEGER      NOT NULL DEFAULT 0,
    "flagged"         BOOLEAN      NOT NULL DEFAULT false,
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- Indexes for fast admin dashboard queries
CREATE INDEX IF NOT EXISTS "Response_email_idx"        ON "Response"("email");
CREATE INDEX IF NOT EXISTS "Response_practiceArea_idx" ON "Response"("practiceArea");
CREATE INDEX IF NOT EXISTS "Response_completed_idx"    ON "Response"("completed");
CREATE INDEX IF NOT EXISTS "Response_started_idx"      ON "Response"("started");
CREATE INDEX IF NOT EXISTS "Response_createdAt_idx"    ON "Response"("createdAt");
