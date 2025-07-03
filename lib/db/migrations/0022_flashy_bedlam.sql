CREATE TABLE IF NOT EXISTS "ProviderConfiguration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"providerType" varchar NOT NULL,
	"providerName" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"isFallback" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"credentials" jsonb DEFAULT '{}' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"lastHealthCheck" timestamp,
	"healthStatus" varchar DEFAULT 'unknown',
	"healthDetails" jsonb DEFAULT '{}',
	"migrationStatus" varchar DEFAULT 'stable',
	"migrationDetails" jsonb DEFAULT '{}',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" uuid,
	"updatedBy" uuid,
	CONSTRAINT "ProviderConfiguration_organizationId_providerType_providerName_unique" UNIQUE("organizationId","providerType","providerName")
);

-- CRITICAL: Multi-tenant security implementation
-- Step 1: Add organizationId as nullable first
ALTER TABLE "User" ADD COLUMN "organizationId" uuid;

-- Step 2: Add timestamps
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;

-- Step 3: Ensure default organization exists
INSERT INTO "Organization" (id, name, "createdAt", "updatedAt")
VALUES (
  'b0d94e1e-8e7f-4f8f-9b5a-3c2d1e0f9a8b',
  'Default Organization', 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Update existing users to belong to default organization
UPDATE "User" 
SET "organizationId" = 'b0d94e1e-8e7f-4f8f-9b5a-3c2d1e0f9a8b'
WHERE "organizationId" IS NULL;

-- Step 5: Make organizationId NOT NULL
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

-- Step 6: Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "ProviderConfiguration" ADD CONSTRAINT "ProviderConfiguration_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ProviderConfiguration" ADD CONSTRAINT "ProviderConfiguration_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ProviderConfiguration" ADD CONSTRAINT "ProviderConfiguration_updatedBy_User_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 7: Add User organizationId foreign key
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 8: Add performance index
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

-- Step 9: Add documentation
COMMENT ON COLUMN "User"."organizationId" IS 'CRITICAL: Multi-tenant isolation boundary. NEVER query User without this filter.';
