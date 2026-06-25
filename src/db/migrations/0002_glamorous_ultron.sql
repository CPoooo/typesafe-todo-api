ALTER TABLE "todos" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "completed" boolean DEFAULT false NOT NULL;