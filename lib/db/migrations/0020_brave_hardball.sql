CREATE TABLE IF NOT EXISTS "quota_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"threshold_percentage" integer DEFAULT 80 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"trigger_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"current_month" integer NOT NULL,
	"current_year" integer NOT NULL,
	"monthly_messages_used" integer DEFAULT 0 NOT NULL,
	"daily_messages_used" integer DEFAULT 0 NOT NULL,
	"last_message_date" date,
	"companions_count" integer DEFAULT 0 NOT NULL,
	"documents_count" integer DEFAULT 0 NOT NULL,
	"total_storage_used_mb" integer DEFAULT 0 NOT NULL,
	"mcp_servers_count" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"last_daily_reset" date,
	CONSTRAINT "usage_tracking_user_id_organization_id_current_month_current_year_unique" UNIQUE("user_id","organization_id","current_month","current_year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"monthly_messages_limit" integer DEFAULT 1000 NOT NULL,
	"daily_messages_limit" integer DEFAULT 100 NOT NULL,
	"max_companions" integer DEFAULT 5 NOT NULL,
	"max_custom_companions" integer DEFAULT 2 NOT NULL,
	"max_documents" integer DEFAULT 100 NOT NULL,
	"max_document_size_mb" integer DEFAULT 10 NOT NULL,
	"total_storage_mb" integer DEFAULT 500 NOT NULL,
	"max_mcp_servers" integer DEFAULT 3 NOT NULL,
	"quota_type" varchar(50) DEFAULT 'standard' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_quotas_user_id_organization_id_unique" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quota_alerts" ADD CONSTRAINT "quota_alerts_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quota_alerts" ADD CONSTRAINT "quota_alerts_organization_id_Organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_organization_id_Organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_quotas" ADD CONSTRAINT "user_quotas_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_quotas" ADD CONSTRAINT "user_quotas_organization_id_Organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
