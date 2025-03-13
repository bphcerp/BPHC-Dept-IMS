ALTER TABLE "qp_requests" DROP CONSTRAINT "qp_requests_request_id_applications_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qp_requests" ADD CONSTRAINT "qp_requests_request_id_text_fields_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."text_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
