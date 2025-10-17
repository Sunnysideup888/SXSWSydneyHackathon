CREATE TYPE "public"."ticket_status" AS ENUM('Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Cancelled');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	CONSTRAINT "people_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"decision" text,
	"consequences" text,
	"status" "ticket_status" DEFAULT 'To Do' NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets_to_people" (
	"ticket_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	CONSTRAINT "tickets_to_people_ticket_id_person_id_pk" PRIMARY KEY("ticket_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "ticket_dependencies" (
	"ticket_id" integer NOT NULL,
	"depends_on_ticket_id" integer NOT NULL,
	CONSTRAINT "ticket_dependencies_ticket_id_depends_on_ticket_id_pk" PRIMARY KEY("ticket_id","depends_on_ticket_id")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets_to_people" ADD CONSTRAINT "tickets_to_people_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets_to_people" ADD CONSTRAINT "tickets_to_people_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_dependencies" ADD CONSTRAINT "ticket_dependencies_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_dependencies" ADD CONSTRAINT "ticket_dependencies_depends_on_ticket_id_tickets_id_fk" FOREIGN KEY ("depends_on_ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;