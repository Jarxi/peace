import { Migration } from '@mikro-orm/migrations';

export class Migration20251018014236 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "feed_shopify"."load_state" add column if not exists "runtime_log" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "feed_shopify"."load_state" drop column if exists "runtime_log";`);
  }

}
