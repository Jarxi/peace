import { Migration } from '@mikro-orm/migrations';

export class Migration20251007220614 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vendor_store_claim_state" ("platform_id" text not null, "store_id" text not null, "owner_info" jsonb null, "claim_code" text null, "claimed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_store_claim_state_pkey" primary key ("platform_id", "store_id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_store_claim_state_deleted_at" ON "vendor_store_claim_state" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vendor_store_claim_state" cascade;`);
  }

}
