ALTER TABLE "trips" DROP CONSTRAINT "trips_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;