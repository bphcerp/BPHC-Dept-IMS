import {
    pgTable,
    integer,
    text,
    timestamp,
    boolean,
} from "drizzle-orm/pg-core";

export const course = pgTable("course", {
    code: text("code").primaryKey(), // PK as per ERD
    name: text("name").notNull(),

    lectureSecCount: integer("lecture_sec_count").notNull(),
    tutSecCount: integer("tut_sec_count").notNull(),
    practicalSecCount: integer("practical_sec_count").notNull(),

    units: integer("units"), // ERD says derived, but stored here
    hasLongPracticalSec: boolean("has_long_practical_sec").notNull(),

    isCDC: boolean("is_cdc").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
});
