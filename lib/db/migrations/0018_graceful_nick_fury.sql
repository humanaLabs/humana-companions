ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" varchar DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "messagesSent" integer DEFAULT 0 NOT NULL;