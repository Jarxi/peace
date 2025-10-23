import { Migration } from '@mikro-orm/migrations';

export class Migration20251018015501 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "feed_shopify"."product_info" ("store_id" text not null, "product_id" text not null, "version_id" text not null, "product_info" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_info_pkey" primary key ("store_id", "product_id", "version_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_info_deleted_at" ON "feed_shopify"."product_info" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_product_info_store_version" ON "feed_shopify"."product_info" (store_id, version_id) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "feed_shopify"."product_variant_info" ("store_id" text not null, "product_id" text not null, "variant_id" text not null, "version_id" text not null, "variant_info" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_variant_info_pkey" primary key ("store_id", "product_id", "variant_id", "version_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_info_deleted_at" ON "feed_shopify"."product_variant_info" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_product_variant_info_store_product_variant" ON "feed_shopify"."product_variant_info" (store_id, product_id, version_id) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "feed_shopify"."shop_info" ("store_id" text not null, "version_id" text not null, "shop_info" jsonb null, "shipping" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shop_info_pkey" primary key ("store_id", "version_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shop_info_deleted_at" ON "feed_shopify"."shop_info" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_shop_info_store_version" ON "feed_shopify"."shop_info" (store_id, version_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "feed_shopify"."product_info" cascade;`);

    this.addSql(`drop table if exists "feed_shopify"."product_variant_info" cascade;`);

    this.addSql(`drop table if exists "feed_shopify"."shop_info" cascade;`);
  }

}
