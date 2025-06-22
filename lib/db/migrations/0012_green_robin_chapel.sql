ALTER TABLE "Companion" ADD COLUMN "organizationId" uuid;--> statement-breakpoint
ALTER TABLE "Companion" ADD COLUMN "positionId" text;--> statement-breakpoint
ALTER TABLE "Companion" ADD COLUMN "linkedTeamId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Companion" ADD CONSTRAINT "Companion_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
