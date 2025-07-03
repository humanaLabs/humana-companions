-- Migration: Add organizationId to User table
-- This is CRITICAL for multi-tenant security

-- Add organizationId column (nullable first)
ALTER TABLE "User" ADD COLUMN "organizationId" uuid;

-- Add foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" 
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");

-- For existing users without organization, assign them to default org
-- First, ensure we have a default organization
INSERT INTO "Organization" (id, name, "createdAt", "updatedAt")
VALUES (
  'default-org-uuid-here-replace-me',
  'Default Organization', 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update existing users to belong to default organization
UPDATE "User" 
SET "organizationId" = 'default-org-uuid-here-replace-me'
WHERE "organizationId" IS NULL;

-- Now make organizationId NOT NULL
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

-- Add index for performance
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- Add comment for documentation
COMMENT ON COLUMN "User"."organizationId" IS 'CRITICAL: Multi-tenant isolation boundary. NEVER query User without this filter.'; 