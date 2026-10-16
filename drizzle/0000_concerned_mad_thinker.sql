CREATE TABLE "offers" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"budget" numeric NOT NULL,
	"currency" varchar(3) NOT NULL,
	"platform_fee_percent" numeric NOT NULL,
	"estimated_hours" numeric NOT NULL,
	"deposit_percent" numeric NOT NULL,
	"payment_terms_days" numeric NOT NULL,
	"allowed_revisions" integer NOT NULL,
	"target_rate" numeric NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_hourly_rate" numeric NOT NULL,
	"profitability_margin" numeric NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_tier" varchar(8) NOT NULL,
	"recommend_action" varchar(10) NOT NULL,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "offers_created_at_idx" ON "offers" USING btree ("created_at");