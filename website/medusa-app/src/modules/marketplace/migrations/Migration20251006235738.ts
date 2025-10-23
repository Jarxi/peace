import { Migration } from '@mikro-orm/migrations';

export class Migration20251006235738 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vendor_store" ("id" text not null, "name" text not null, "vendor_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_store_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_store_vendor_id" ON "vendor_store" (vendor_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_store_deleted_at" ON "vendor_store" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vendor_store" add constraint "vendor_store_vendor_id_foreign" foreign key ("vendor_id") references "vendor" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vendor_store" cascade;`);
  }

}
