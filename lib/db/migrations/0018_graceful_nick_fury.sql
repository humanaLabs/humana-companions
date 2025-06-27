ALTER TABLE "User" ADD COLUMN "plan" varchar DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "messagesSent" integer DEFAULT 0 NOT NULL;