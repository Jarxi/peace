import { Migration } from '@mikro-orm/migrations';

export class Migration20251012073533 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "traffic_events" ("event_id" text not null, "store_platform" text not null, "store_id" text not null, "domain" text not null, "path" text not null, "type" text not null, "occurred_at" timestamptz not null, "metadata" jsonb null, "llm_source" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "traffic_events_pkey" primary key ("event_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_traffic_events_deleted_at" ON "traffic_events" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "traffic_events" cascade;`);
  }

}
