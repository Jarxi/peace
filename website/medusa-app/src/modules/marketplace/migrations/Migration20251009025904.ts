import { Migration } from '@mikro-orm/migrations';

export class Migration20251009025904 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store" drop constraint if exists "vendor_store_vendor_id_foreign";`);

    this.addSql(`alter table if exists "vendor_store" drop column if exists "name";`);

    this.addSql(`alter table if exists "vendor_store" add column if not exists "store_id" text null, add column if not exists "claim_code" text null, add column if not exists "claimed_at" timestamptz null;`);
    this.addSql(`alter table if exists "vendor_store" alter column "vendor_id" type text using ("vendor_id"::text);`);
    this.addSql(`alter table if exists "vendor_store" alter column "vendor_id" drop not null;`);
    this.addSql(`alter table if exists "vendor_store" add constraint "vendor_store_vendor_id_foreign" foreign key ("vendor_id") references "vendor" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store" drop constraint if exists "vendor_store_vendor_id_foreign";`);

    this.addSql(`alter table if exists "vendor_store" drop column if exists "store_id", drop column if exists "claim_code", drop column if exists "claimed_at";`);

    this.addSql(`alter table if exists "vendor_store" add column if not exists "name" text not null;`);
    this.addSql(`alter table if exists "vendor_store" alter column "vendor_id" type text using ("vendor_id"::text);`);
    this.addSql(`alter table if exists "vendor_store" alter column "vendor_id" set not null;`);
    this.addSql(`alter table if exists "vendor_store" add constraint "vendor_store_vendor_id_foreign" foreign key ("vendor_id") references "vendor" ("id") on update cascade;`);
  }

}
