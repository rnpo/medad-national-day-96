import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memories = sqliteTable(
  "memories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    message: text("message").notNull(),
    traitKey: text("trait_key").notNull(),
    traitTitle: text("trait_title").notNull(),
    color: text("color").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_memories_created_at").on(table.createdAt)]
);
