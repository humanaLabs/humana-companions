CREATE TABLE IF NOT EXISTS "CommunityForum" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CommunityForum_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForumPost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forumId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"organizationId" uuid,
	"parentPostId" uuid,
	"title" varchar(200),
	"content" text NOT NULL,
	"type" varchar(20) DEFAULT 'discussion' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"replyCount" integer DEFAULT 0 NOT NULL,
	"isApproved" boolean DEFAULT true NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "LearningLesson" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moduleId" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"duration" integer NOT NULL,
	"content" jsonb NOT NULL,
	"learningObjectives" jsonb NOT NULL,
	"interactiveElements" jsonb DEFAULT '[]'::jsonb,
	"assessmentQuestions" jsonb DEFAULT '[]'::jsonb,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "LearningModule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"duration" integer NOT NULL,
	"difficultyLevel" varchar(20) NOT NULL,
	"learningObjectives" jsonb NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "LearningModule_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "OnboardingProgress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"organizationId" uuid,
	"currentStep" integer DEFAULT 0 NOT NULL,
	"totalSteps" integer NOT NULL,
	"completionRate" real DEFAULT 0 NOT NULL,
	"timeSpent" integer DEFAULT 0 NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"strugglingPoints" jsonb DEFAULT '[]'::jsonb,
	"adaptationEvents" jsonb DEFAULT '[]'::jsonb,
	"personalizedContent" jsonb DEFAULT '{}'::jsonb,
	"featureDiscoveryRate" real DEFAULT 0,
	"interactionQuality" real DEFAULT 0,
	"confidenceLevel" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserCertification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"organizationId" uuid,
	"moduleId" uuid NOT NULL,
	"certificateTitle" varchar(200) NOT NULL,
	"issuer" varchar(100) DEFAULT 'Humana AI University' NOT NULL,
	"certificateId" varchar(50) NOT NULL,
	"finalScore" real NOT NULL,
	"passingScore" real DEFAULT 80 NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	"validUntil" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"customBranding" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserCertification_certificateId_unique" UNIQUE("certificateId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserCognitiveProfile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"organizationId" uuid,
	"primaryCognitiveStyle" varchar(20) NOT NULL,
	"secondaryCognitiveStyle" varchar(20),
	"adaptationLevel" varchar(10) NOT NULL,
	"aiToolsExperience" varchar(20) NOT NULL,
	"businessContext" varchar(20) NOT NULL,
	"technicalSkills" varchar(20) NOT NULL,
	"primaryGoal" text NOT NULL,
	"secondaryGoals" jsonb DEFAULT '[]'::jsonb,
	"timeframe" varchar(20) NOT NULL,
	"role" varchar(100),
	"department" varchar(100),
	"useCase" text,
	"teamSize" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserLearningProgress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"organizationId" uuid,
	"moduleId" uuid NOT NULL,
	"lessonId" uuid,
	"status" varchar(20) NOT NULL,
	"progressPercentage" real DEFAULT 0 NOT NULL,
	"timeSpent" integer DEFAULT 0 NOT NULL,
	"quizScore" real,
	"practicalScore" real,
	"attempts" integer DEFAULT 0 NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"certifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserLearningProgress_userId_moduleId_pk" PRIMARY KEY("userId","moduleId")
);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "organizationId" uuid;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "Message_v2" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "ProjectFolder" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "Stream" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "Suggestion" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "Vote_v2" ADD COLUMN "organizationId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CommunityForum" ADD CONSTRAINT "CommunityForum_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_forumId_CommunityForum_id_fk" FOREIGN KEY ("forumId") REFERENCES "public"."CommunityForum"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "LearningLesson" ADD CONSTRAINT "LearningLesson_moduleId_LearningModule_id_fk" FOREIGN KEY ("moduleId") REFERENCES "public"."LearningModule"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "LearningModule" ADD CONSTRAINT "LearningModule_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserCertification" ADD CONSTRAINT "UserCertification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserCertification" ADD CONSTRAINT "UserCertification_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserCertification" ADD CONSTRAINT "UserCertification_moduleId_LearningModule_id_fk" FOREIGN KEY ("moduleId") REFERENCES "public"."LearningModule"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserCognitiveProfile" ADD CONSTRAINT "UserCognitiveProfile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserCognitiveProfile" ADD CONSTRAINT "UserCognitiveProfile_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLearningProgress" ADD CONSTRAINT "UserLearningProgress_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLearningProgress" ADD CONSTRAINT "UserLearningProgress_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLearningProgress" ADD CONSTRAINT "UserLearningProgress_moduleId_LearningModule_id_fk" FOREIGN KEY ("moduleId") REFERENCES "public"."LearningModule"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLearningProgress" ADD CONSTRAINT "UserLearningProgress_lessonId_LearningLesson_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."LearningLesson"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "McpServer" ADD CONSTRAINT "McpServer_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProjectFolder" ADD CONSTRAINT "ProjectFolder_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Stream" ADD CONSTRAINT "Stream_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
