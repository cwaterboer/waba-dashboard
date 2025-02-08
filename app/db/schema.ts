import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: text("id").primaryKey(),
  fromNumber: text("from_number"),
  messageType: text("message_type"),
  messageBody: text("message_body"),
  timestamp: timestamp("timestamp").defaultNow(),
});