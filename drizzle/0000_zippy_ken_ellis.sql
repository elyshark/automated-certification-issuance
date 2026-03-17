CREATE TABLE "certificate" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"path" varchar(256) NOT NULL,
	"issued_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"issued_to" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"given_name" text NOT NULL,
	"surname" text NOT NULL,
	"email" text NOT NULL,
	"position" text NOT NULL,
	"role" varchar(13) DEFAULT 'USER' NOT NULL,
	CONSTRAINT "employee_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7)
);
--> statement-breakpoint
CREATE TABLE "training" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_code" varchar(3) NOT NULL,
	"trainee_id" integer NOT NULL,
	"location_code" varchar(3) NOT NULL,
	"training_date" timestamp with time zone NOT NULL,
	"reviewed_date" timestamp with time zone,
	"certificate_id" varchar(12),
	"reviewer_id" integer,
	"status" varchar(8) NOT NULL,
	"remarks" text,
	"renewed_from_id" integer,
	CONSTRAINT "training_history_certificate_id_unique" UNIQUE("certificate_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_issued_to_employee_id_fk" FOREIGN KEY ("issued_to") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_history" ADD CONSTRAINT "training_history_training_code_training_code_fk" FOREIGN KEY ("training_code") REFERENCES "public"."training"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_history" ADD CONSTRAINT "training_history_trainee_id_employee_id_fk" FOREIGN KEY ("trainee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_history" ADD CONSTRAINT "training_history_location_code_location_code_fk" FOREIGN KEY ("location_code") REFERENCES "public"."location"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_history" ADD CONSTRAINT "training_history_certificate_id_certificate_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificate"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_history" ADD CONSTRAINT "training_history_reviewer_id_employee_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_history" ADD CONSTRAINT "training_history_renewed_from_id_training_history_id_fk" FOREIGN KEY ("renewed_from_id") REFERENCES "public"."training_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE VIEW "public"."upcoming_renewals" AS (select "employee"."email", "employee"."given_name", "employee"."surname", "training"."name", "certificate"."expiry_date", "certificate"."id" from "certificate" inner join "employee" on "certificate"."issued_to" = "employee"."id" inner join "training_history" on "training_history"."certificate_id" = "certificate"."id" inner join "training" on "training_history"."training_code" = "training"."code" where ("certificate"."expiry_date" <= CURRENT_DATE + INTERVAL '90 days' and "certificate"."expiry_date" >= CURRENT_DATE));