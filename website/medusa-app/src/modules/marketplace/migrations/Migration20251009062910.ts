import { Migration } from '@mikro-orm/migrations';

export class Migration20251009062910 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_claim_state" add column if not exists "deletion_requested_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_claim_state" drop column if exists "deletion_requested_at";`);
  }

}
