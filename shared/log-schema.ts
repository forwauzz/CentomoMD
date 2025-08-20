import { pgTable, text, timestamp, integer, jsonb, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const systemLogs = pgTable("system_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: varchar("level", { length: 10 }).notNull(), // DEBUG, INFO, WARN, ERROR, FATAL
  category: varchar("category", { length: 20 }).notNull(), // AUTH, API, FORM, VOICE, OCR, etc.
  component: varchar("component", { length: 50 }).notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  
  // User tracking (hashed, no PII)
  userId: varchar("user_id", { length: 100 }),
  sessionId: varchar("session_id", { length: 100 }),
  correlationId: varchar("correlation_id", { length: 100 }),
  
  // Sanitized metadata (medical data removed)
  metadata: jsonb("metadata").default({}).notNull(),
  
  // Error information
  errorMessage: text("error_message"),
  errorCode: varchar("error_code", { length: 50 }),
  
  // Montreal timezone for medical practice
  localTimestamp: timestamp("local_timestamp").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  timestampIdx: index("logs_timestamp_idx").on(table.timestamp),
  categoryIdx: index("logs_category_idx").on(table.category),
  levelIdx: index("logs_level_idx").on(table.level),
  userIdx: index("logs_user_idx").on(table.userId),
  eventIdx: index("logs_event_idx").on(table.event),
  localTimestampIdx: index("logs_local_timestamp_idx").on(table.localTimestamp)
}));

// Zod schemas
export const insertSystemLogSchema = createInsertSchema(systemLogs);
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// Search and filter schemas
export const logSearchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  category: z.enum(['AUTH', 'API', 'FORM', 'VOICE', 'OCR', 'AI', 'SYSTEM', 'SECURITY', 'PERFORMANCE']).optional(),
  userId: z.string().optional(),
  event: z.string().optional(),
  search: z.string().optional(), // Free text search
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

export type LogSearchParams = z.infer<typeof logSearchSchema>;