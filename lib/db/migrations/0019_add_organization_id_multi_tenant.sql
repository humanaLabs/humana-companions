-- Migration 0019: Add organizationId to all tenant tables for multi-tenancy
-- This migration implements P0B from the foundation roadmap

-- Add organizationId to Chat table
ALTER TABLE "Chat" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "Chat_organizationId_userId_idx" ON "Chat"("organizationId", "userId");

-- Add organizationId to Document table  
ALTER TABLE "Document" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "Document_organizationId_userId_idx" ON "Document"("organizationId", "userId");

-- Add organizationId to McpServer table
ALTER TABLE "McpServer" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "McpServer" ADD CONSTRAINT "McpServer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "McpServer_organizationId_userId_idx" ON "McpServer"("organizationId", "userId");

-- Add organizationId to ProjectFolder table
ALTER TABLE "ProjectFolder" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "ProjectFolder" ADD CONSTRAINT "ProjectFolder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "ProjectFolder_organizationId_userId_idx" ON "ProjectFolder"("organizationId", "userId");

-- Add organizationId to Message_v2 table
ALTER TABLE "Message_v2" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint  
ALTER TABLE "Message_v2" ADD CONSTRAINT "Message_v2_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "Message_v2_organizationId_chatId_idx" ON "Message_v2"("organizationId", "chatId");

-- Add organizationId to Vote_v2 table
ALTER TABLE "Vote_v2" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "Vote_v2_organizationId_chatId_idx" ON "Vote_v2"("organizationId", "chatId");

-- Add organizationId to Suggestion table
ALTER TABLE "Suggestion" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "Suggestion_organizationId_userId_idx" ON "Suggestion"("organizationId", "userId");

-- Add organizationId to Stream table
ALTER TABLE "Stream" ADD COLUMN "organizationId" UUID;
-- Add foreign key constraint
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id");
-- Add index for performance
CREATE INDEX CONCURRENTLY "Stream_organizationId_chatId_idx" ON "Stream"("organizationId", "chatId");

-- Migrate existing data to default organization (first organization in the system)
-- This step is critical for data integrity

DO $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Get the first organization ID
    SELECT id INTO default_org_id FROM "Organization" ORDER BY "createdAt" LIMIT 1;
    
    -- If no organization exists, create a default one
    IF default_org_id IS NULL THEN
        INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'Default Organization', 'default', NOW(), NOW())
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Update all tables with the default organization ID
    UPDATE "Chat" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Document" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "McpServer" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "ProjectFolder" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Message_v2" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Vote_v2" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Suggestion" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    UPDATE "Stream" SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;
    
    RAISE NOTICE 'Migrated all existing data to default organization: %', default_org_id;
END $$;

-- Make organizationId NOT NULL after data migration
ALTER TABLE "Chat" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "McpServer" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ProjectFolder" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Message_v2" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Vote_v2" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Suggestion" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Stream" ALTER COLUMN "organizationId" SET NOT NULL;

-- Create audit table for cross-tenant access attempts
CREATE TABLE IF NOT EXISTS "CrossTenantAuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id"),
    "attemptedOrganizationId" UUID NOT NULL,
    "userOrganizationId" UUID NOT NULL,
    "resourceType" VARCHAR(100) NOT NULL,
    "resourceId" UUID NOT NULL,
    "accessDeniedAt" TIMESTAMP DEFAULT NOW(),
    "requestDetails" JSONB
);

-- Add index for audit log queries
CREATE INDEX "CrossTenantAuditLog_userId_idx" ON "CrossTenantAuditLog"("userId");
CREATE INDEX "CrossTenantAuditLog_attemptedOrganizationId_idx" ON "CrossTenantAuditLog"("attemptedOrganizationId");
CREATE INDEX "CrossTenantAuditLog_accessDeniedAt_idx" ON "CrossTenantAuditLog"("accessDeniedAt");

-- Enable Row Level Security on all tenant tables
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "McpServer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectFolder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote_v2" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stream" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "tenant_isolation_chat" ON "Chat"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_document" ON "Document"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_mcp_server" ON "McpServer"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_project_folder" ON "ProjectFolder"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_message_v2" ON "Message_v2"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_vote_v2" ON "Vote_v2"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_suggestion" ON "Suggestion"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

CREATE POLICY "tenant_isolation_stream" ON "Stream"
    USING ("organizationId" = current_setting('app.current_organization_id')::uuid);

-- Create helper function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(user_id UUID, organization_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, true);
    PERFORM set_config('app.current_organization_id', organization_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_organization_id')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to validate organization access
CREATE OR REPLACE FUNCTION validate_organization_access()
RETURNS TRIGGER AS $$
DECLARE
    current_org_id UUID;
BEGIN
    current_org_id := get_current_organization_id();
    
    -- If no organization context is set, allow (for admin operations)
    IF current_org_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- For INSERT and UPDATE, validate NEW record
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW."organizationId" != current_org_id THEN
            RAISE EXCEPTION 'Cross-tenant access denied: Attempted to access organization % from context %', 
                NEW."organizationId", current_org_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- For DELETE, validate OLD record
    IF TG_OP = 'DELETE' THEN
        IF OLD."organizationId" != current_org_id THEN
            RAISE EXCEPTION 'Cross-tenant access denied: Attempted to delete from organization % from context %', 
                OLD."organizationId", current_org_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation triggers to all tenant tables
CREATE TRIGGER "validate_chat_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "Chat"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_document_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "Document"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_mcp_server_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "McpServer"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_project_folder_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "ProjectFolder"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_message_v2_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "Message_v2"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_vote_v2_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "Vote_v2"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_suggestion_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "Suggestion"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

CREATE TRIGGER "validate_stream_organization"
    BEFORE INSERT OR UPDATE OR DELETE ON "Stream"
    FOR EACH ROW EXECUTE FUNCTION validate_organization_access();

-- Migration completed successfully
-- All tenant tables now have organizationId with proper constraints, indexes, and RLS policies 