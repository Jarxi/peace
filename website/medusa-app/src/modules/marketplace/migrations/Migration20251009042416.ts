import { Migration } from '@mikro-orm/migrations';

export class Migration20251009042416 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_claim_state" drop column if exists "owner_info";`);

    this.addSql(`alter table if exists "vendor_store_claim_state" add column if not exists "vendor_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_claim_state" drop column if exists "vendor_id";`);

    this.addSql(`alter table if exists "vendor_store_claim_state" add column if not exists "owner_info" jsonb null;`);
  }

}
