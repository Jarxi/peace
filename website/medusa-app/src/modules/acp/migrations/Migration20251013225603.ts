import { Migration } from '@mikro-orm/migrations';

export class Migration20251013225603 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "acp_checkout_session" drop constraint if exists "acp_checkout_session_medusa_cart_id_unique";`);
    this.addSql(`create table if not exists "acp_checkout_session" ("id" text not null, "status" text check ("status" in ('not_ready_for_payment', 'ready_for_payment', 'completed', 'canceled')) not null default 'not_ready_for_payment', "medusa_cart_id" text not null, "medusa_order_id" text null, "fulfillment_option_id" text null, "payment_token" text null, "payment_provider" text null, "idempotency_key" text null, "last_request_id" text null, "completed_at" timestamptz null, "canceled_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "acp_checkout_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_acp_checkout_session_medusa_cart_id_unique" ON "acp_checkout_session" (medusa_cart_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_acp_checkout_session_deleted_at" ON "acp_checkout_session" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "acp_checkout_session_message" ("id" text not null, "checkout_session_id" text not null, "type" text check ("type" in ('info', 'error')) not null, "code" text null, "param" text null, "content_type" text check ("content_type" in ('plain', 'markdown')) not null, "content" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "acp_checkout_session_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_acp_checkout_session_message_deleted_at" ON "acp_checkout_session_message" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "acp_checkout_session_webhook_log" ("id" text not null, "checkout_session_id" text null, "event_type" text check ("event_type" in ('order_created', 'order_updated')) not null, "payload" jsonb not null, "response_status" integer null, "response_body" text null, "sent_at" timestamptz not null default now(), "succeeded" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "acp_checkout_session_webhook_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_acp_checkout_session_webhook_log_deleted_at" ON "acp_checkout_session_webhook_log" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acp_checkout_session" cascade;`);

    this.addSql(`drop table if exists "acp_checkout_session_message" cascade;`);

    this.addSql(`drop table if exists "acp_checkout_session_webhook_log" cascade;`);
  }

}
