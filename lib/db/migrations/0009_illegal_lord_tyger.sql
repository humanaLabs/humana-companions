ALTER TABLE "McpServer" ADD COLUMN "authType" varchar DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "authToken" text;--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "authUsername" varchar(100);--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "authPassword" varchar(100);--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "authHeaderName" varchar(50);--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "isConnected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "lastConnectionTest" timestamp;--> statement-breakpoint
ALTER TABLE "McpServer" ADD COLUMN "connectionError" text;