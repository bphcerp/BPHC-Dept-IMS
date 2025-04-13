CREATE TYPE "public"."inventory_category_type" AS ENUM('Vendor', 'Inventory');--> statement-breakpoint
CREATE TYPE "public"."inventory_funding_source" AS ENUM('Institute', 'Project');--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('Working', 'Not Working', 'Under Repair');--> statement-breakpoint
CREATE TABLE "inventory_categories" (
	"id" uuid PRIMARY KEY DEFAULT '1afffedc-757d-4a80-8472-a2022a8cef1e' NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" "inventory_category_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT 'd96062ad-6449-4e52-abc8-ffef0f65d31a' NOT NULL,
	"serial_number" integer NOT NULL,
	"lab_id" uuid,
	"transfer_id" uuid,
	"item_category_id" uuid,
	"item_name" text NOT NULL,
	"specifications" text,
	"quantity" integer NOT NULL,
	"no_of_licenses" integer,
	"nature_of_license" text,
	"year_of_lease" integer,
	"po_amount" numeric(15, 2) NOT NULL,
	"po_number" text,
	"po_date" date,
	"lab_incharge_at_purchase" text,
	"lab_technician_at_purchase" text,
	"equipment_id" text NOT NULL,
	"funding_source" "inventory_funding_source",
	"date_of_installation" date,
	"vendor_id" uuid,
	"warranty_from" date,
	"warranty_to" date,
	"amc_from" date,
	"amc_to" date,
	"current_location" text NOT NULL,
	"softcopy_of_po" text,
	"softcopy_of_invoice" text,
	"softcopy_of_nfa" text,
	"softcopy_of_amc" text,
	"status" "inventory_status",
	"equipment_photo" text,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_equipment_id_unique" UNIQUE("equipment_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_laboratories" (
	"id" uuid PRIMARY KEY DEFAULT 'a221b25b-9b75-426c-b0a5-b96ff27aa554' NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"code" char(4) NOT NULL,
	"technician_in_charge_email" text,
	"faculty_in_charge_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_laboratories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vendor_categories" (
	"vendor_id" uuid,
	"category_id" uuid,
	CONSTRAINT "vendor_categories_vendor_id_category_id_pk" PRIMARY KEY("vendor_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_vendors" (
	"id" uuid PRIMARY KEY DEFAULT '439d9bfa-0dc8-49c0-b707-c23a52363333' NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"poc_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_lab_id_inventory_laboratories_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."inventory_laboratories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_transfer_id_inventory_items_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_item_category_id_inventory_categories_id_fk" FOREIGN KEY ("item_category_id") REFERENCES "public"."inventory_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_vendor_id_inventory_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."inventory_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_laboratories" ADD CONSTRAINT "inventory_laboratories_technician_in_charge_email_staff_email_fk" FOREIGN KEY ("technician_in_charge_email") REFERENCES "public"."staff"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_laboratories" ADD CONSTRAINT "inventory_laboratories_faculty_in_charge_email_faculty_email_fk" FOREIGN KEY ("faculty_in_charge_email") REFERENCES "public"."faculty"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_categories" ADD CONSTRAINT "vendor_categories_vendor_id_inventory_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."inventory_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_categories" ADD CONSTRAINT "vendor_categories_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."inventory_categories"("id") ON DELETE no action ON UPDATE no action;