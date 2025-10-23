import { Migration } from '@mikro-orm/migrations';

export class Migration20251014090000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vendor_client_source" ("platform_id" text not null, "store_id" text not null, "client_id" text not null, "source" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_client_source_pkey" primary key ("platform_id", "store_id", "client_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_client_source_primary" ON "vendor_client_source" (platform_id, store_id, client_id);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_client_source_deleted_at" ON "vendor_client_source" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vendor_client_source" cascade;`);
  }

}
