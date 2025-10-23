import { Migration } from '@mikro-orm/migrations';

export class Migration20251018013732 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create schema if not exists "feed_shopify";`);
    this.addSql(`create table if not exists "feed_shopify"."load_state" ("store_id" text not null, "version_id" text not null, "version_time" timestamptz not null, "state" text not null, "metrics" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "load_state_pkey" primary key ("store_id", "version_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_load_state_deleted_at" ON "feed_shopify"."load_state" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_load_state_store_version" ON "feed_shopify"."load_state" (store_id, version_time) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_load_state_store_success_version" ON "feed_shopify"."load_state" (store_id, version_time) WHERE state = 'success' AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "feed_shopify"."load_state" cascade;`);

    this.addSql(`drop schema if exists "feed_shopify";`);
  }

}
