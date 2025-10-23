import { model } from "@medusajs/framework/utils"

const TrafficEvent = model.define("traffic_events", {
    event_id: model.text().primaryKey(),
    store_platform: model.text(),
    store_id: model.text(),
    domain: model.text(),
    path: model.text(),
    type: model.text(),
    occurred_at: model.dateTime(),
    metadata: model.json().nullable(),
    primary_source: model.text(),
})

export default TrafficEvent
