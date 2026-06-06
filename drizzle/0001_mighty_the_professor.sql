ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_lower_idx" ON "user" USING btree (lower("username"));