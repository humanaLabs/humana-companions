ALTER TABLE "UserLearningProgress" ALTER COLUMN "organizationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "UserLearningProgress" DROP COLUMN IF EXISTS "id";