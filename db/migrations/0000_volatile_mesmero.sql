CREATE TYPE "public"."event_state" AS ENUM('rascunho', 'aberto', 'sorteio', 'encerrado');--> statement-breakpoint
CREATE TYPE "public"."speaker_status" AS ENUM('nenhum', 'pendente', 'aprovado', 'recusado');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"happens_on" text NOT NULL,
	"venue" text,
	"state" "event_state" DEFAULT 'rascunho' NOT NULL,
	"presence_code" text,
	"presence_code_at" timestamp with time zone,
	"raffle_round" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizers_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"handle" text NOT NULL,
	"name" text NOT NULL,
	"years" text NOT NULL,
	"areas" text[] NOT NULL,
	"bio" text,
	"present" boolean DEFAULT false NOT NULL,
	"speaker_status" "speaker_status" DEFAULT 'nenhum' NOT NULL,
	"talk_title" text,
	"role" text,
	"links" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raffle_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"seed" text NOT NULL,
	"pool_size" integer NOT NULL,
	"ordered_handles" text[] NOT NULL,
	"winner_id" uuid,
	"prize" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_organizers_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle_rounds" ADD CONSTRAINT "raffle_rounds_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raffle_rounds" ADD CONSTRAINT "raffle_rounds_winner_id_participants_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_event_handle_idx" ON "participants" USING btree ("event_id","handle");--> statement-breakpoint
CREATE INDEX "participants_event_idx" ON "participants" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "raffle_event_round_idx" ON "raffle_rounds" USING btree ("event_id","round");