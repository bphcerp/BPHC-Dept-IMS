CREATE TABLE "project_pis" (
	"project_id" uuid,
	"investigator_id" uuid,
	CONSTRAINT "project_pis_project_id_investigator_id_pk" PRIMARY KEY("project_id","investigator_id")
);
--> statement-breakpoint
ALTER TABLE "project_pis" ADD CONSTRAINT "project_pis_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pis" ADD CONSTRAINT "project_pis_investigator_id_investigators_id_fk" FOREIGN KEY ("investigator_id") REFERENCES "public"."investigators"("id") ON DELETE no action ON UPDATE no action;