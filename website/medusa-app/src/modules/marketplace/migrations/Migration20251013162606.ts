import { Migration } from '@mikro-orm/migrations';

export class Migration20251014094000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'traffic_events' AND column_name = 'llm_source'
        ) THEN
          ALTER TABLE "traffic_events" RENAME COLUMN "llm_source" TO "primary_source";
        END IF;
      END $$;
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_traffic_events_store_recent" ON "traffic_events" (store_platform, store_id, occurred_at DESC);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_traffic_events_store_type_source" ON "traffic_events" (store_platform, store_id, type, primary_source, occurred_at DESC);`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_traffic_events_store_type_source";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_traffic_events_store_recent";`);

    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'traffic_events' AND column_name = 'primary_source'
        ) THEN
          ALTER TABLE "traffic_events" RENAME COLUMN "primary_source" TO "llm_source";
        END IF;
      END $$;
    `);
  }

}
