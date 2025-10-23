import { Migration } from '@mikro-orm/migrations';

export class Migration20251018064623 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "feed_shopify"."acp_export" ("store_id" text not null, "shop_info" jsonb not null, "products" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "acp_export_pkey" primary key ("store_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_acp_export_deleted_at" ON "feed_shopify"."acp_export" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_acp_export_store" ON "feed_shopify"."acp_export" (store_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "feed_shopify"."acp_export" cascade;`);
  }

}
