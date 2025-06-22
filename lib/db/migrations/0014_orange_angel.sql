CREATE TABLE IF NOT EXISTS "CompanionFeedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companionId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"rating" varchar(1) NOT NULL,
	"comment" text NOT NULL,
	"interactionId" uuid,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CompanionInteraction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companionId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"messageId" uuid,
	"type" varchar NOT NULL,
	"context" json,
	"response" json,
	"duration" varchar(10),
	"tokens_used" varchar(10),
	"success" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CompanionPerformance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companionId" uuid NOT NULL,
	"averageRating" varchar(3),
	"totalFeedback" varchar(10) DEFAULT '0',
	"positiveFeedbackRate" varchar(5),
	"lastFeedbackAt" timestamp,
	"totalInteractions" varchar(10) DEFAULT '0',
	"averageResponseTime" varchar(10),
	"successRate" varchar(5),
	"lastInteractionAt" timestamp,
	"lastMcpCycleAt" timestamp,
	"mcpScore" varchar(4),
	"improvementTrend" varchar DEFAULT 'unknown',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "McpCycleReport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companionId" uuid NOT NULL,
	"cycleDate" timestamp DEFAULT now() NOT NULL,
	"metrics" json NOT NULL,
	"analysis" json NOT NULL,
	"recommendations" json NOT NULL,
	"nextSteps" json NOT NULL,
	"improvementSuggestions" json,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"executedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionFeedback" ADD CONSTRAINT "CompanionFeedback_companionId_Companion_id_fk" FOREIGN KEY ("companionId") REFERENCES "public"."Companion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionFeedback" ADD CONSTRAINT "CompanionFeedback_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionInteraction" ADD CONSTRAINT "CompanionInteraction_companionId_Companion_id_fk" FOREIGN KEY ("companionId") REFERENCES "public"."Companion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionInteraction" ADD CONSTRAINT "CompanionInteraction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionInteraction" ADD CONSTRAINT "CompanionInteraction_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionInteraction" ADD CONSTRAINT "CompanionInteraction_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompanionPerformance" ADD CONSTRAINT "CompanionPerformance_companionId_Companion_id_fk" FOREIGN KEY ("companionId") REFERENCES "public"."Companion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "McpCycleReport" ADD CONSTRAINT "McpCycleReport_companionId_Companion_id_fk" FOREIGN KEY ("companionId") REFERENCES "public"."Companion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "McpCycleReport" ADD CONSTRAINT "McpCycleReport_executedBy_User_id_fk" FOREIGN KEY ("executedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
