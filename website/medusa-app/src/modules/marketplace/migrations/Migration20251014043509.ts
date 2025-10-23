import { Migration } from '@mikro-orm/migrations';

export class Migration20251014043509 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "traffic_aggregated" ("id" text not null, "platform_id" text not null, "store_id" text not null, "primary_source" text not null, "hour_bucket" timestamptz not null, "metrics" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "traffic_aggregated_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_traffic_aggregated_deleted_at" ON "traffic_aggregated" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_store_traffic_aggregated_store" ON "traffic_aggregated" (platform_id, store_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "traffic_aggregated" cascade;`);
  }

}
