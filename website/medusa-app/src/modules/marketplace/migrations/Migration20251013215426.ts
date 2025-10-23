import { Migration } from '@mikro-orm/migrations';

export class Migration20251013215426 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vendor_store_traffic_summary" ("platform_id" text not null, "store_id" text not null, "primary_source" text not null, "product_view_cnt" integer not null default 0, "add_to_cart_cnt" integer not null default 0, "sale_cnt" integer not null default 0, "product_most_view" jsonb null, "product_most_sale" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_store_traffic_summary_pkey" primary key ("platform_id", "store_id", "primary_source"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_store_traffic_summary_deleted_at" ON "vendor_store_traffic_summary" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_store_traffic_summary_platform_store_source" ON "vendor_store_traffic_summary" (platform_id, store_id, primary_source) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vendor_store_traffic_summary" cascade;`);
  }

}
