import { Migration } from '@mikro-orm/migrations';

export class Migration20251007235905 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_claim_state" add column if not exists "store_info" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_claim_state" drop column if exists "store_info";`);
  }

}
