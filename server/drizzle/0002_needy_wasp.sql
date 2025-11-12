ALTER TABLE "users" ALTER COLUMN "age" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "age" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;