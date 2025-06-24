CREATE TABLE IF NOT EXISTS "UserInvite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"roleId" uuid NOT NULL,
	"organizationId" uuid,
	"invitedBy" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"message" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserInvite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_invitedBy_User_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
