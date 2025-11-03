CREATE TYPE "public"."template_colors_enum" AS ENUM('#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#facc15');--> statement-breakpoint
CREATE TYPE "public"."graph_type_enum" AS ENUM('line', 'pie', 'bar');--> statement-breakpoint
CREATE TYPE "public"."y_axis_enum" AS ENUM('Publications', 'Publications Over Time', 'Citations', 'Citations Over Time', 'Publication Type Breakdown', 'Author Contributions');--> statement-breakpoint
CREATE TABLE "graphs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid NOT NULL,
	"slide_number" integer NOT NULL,
	"y_axis" "y_axis_enum",
	"graph_type" "graph_type_enum",
	"color" "template_colors_enum"
);
--> statement-breakpoint
CREATE TABLE "presentation_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slides" integer NOT NULL,
	"faculty_email" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "graphs" ADD CONSTRAINT "graphs_template_id_presentation_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."presentation_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_templates" ADD CONSTRAINT "presentation_templates_faculty_email_faculty_email_fk" FOREIGN KEY ("faculty_email") REFERENCES "public"."faculty"("email") ON DELETE no action ON UPDATE no action;