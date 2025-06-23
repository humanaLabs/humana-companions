CREATE TABLE IF NOT EXISTS "ChatFolder" (
	"chatId" uuid NOT NULL,
	"folderId" uuid NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ChatFolder_chatId_folderId_pk" PRIMARY KEY("chatId","folderId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProjectFolder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) DEFAULT 'bg-blue-500' NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatFolder" ADD CONSTRAINT "ChatFolder_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatFolder" ADD CONSTRAINT "ChatFolder_folderId_ProjectFolder_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."ProjectFolder"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProjectFolder" ADD CONSTRAINT "ProjectFolder_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
