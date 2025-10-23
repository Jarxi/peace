import { Migration } from '@mikro-orm/migrations';

export class Migration20251013224357 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_traffic_summary" drop column if exists "product_view", drop column if exists "add_to_cart", drop column if exists "sale";`);

    this.addSql(`alter table if exists "vendor_store_traffic_summary" add column if not exists "metrics" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_traffic_summary" add column if not exists "add_to_cart" jsonb null, add column if not exists "sale" jsonb null;`);
    this.addSql(`alter table if exists "vendor_store_traffic_summary" rename column "metrics" to "product_view";`);
  }

}
