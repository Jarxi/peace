import { Migration } from '@mikro-orm/migrations';

export class Migration20251013220316 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_traffic_summary" drop column if exists "product_view_cnt", drop column if exists "add_to_cart_cnt", drop column if exists "sale_cnt", drop column if exists "product_most_view", drop column if exists "product_most_sale";`);

    this.addSql(`alter table if exists "vendor_store_traffic_summary" add column if not exists "product_view" jsonb null, add column if not exists "add_to_cart" jsonb null, add column if not exists "sale" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_store_traffic_summary" drop column if exists "product_view", drop column if exists "add_to_cart", drop column if exists "sale";`);

    this.addSql(`alter table if exists "vendor_store_traffic_summary" add column if not exists "product_view_cnt" integer not null default 0, add column if not exists "add_to_cart_cnt" integer not null default 0, add column if not exists "sale_cnt" integer not null default 0, add column if not exists "product_most_view" jsonb null, add column if not exists "product_most_sale" jsonb null;`);
  }

}
