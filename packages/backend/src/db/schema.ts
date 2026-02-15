import {
    pgTable,
    uuid,
    text,
    timestamp,
    varchar,
    jsonb,
    primaryKey,
    index,
    pgEnum,
    customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Custom pgvector type ──────────────────────────────────────────────
const vector = customType<{ data: number[]; driverParam: string }>({
    dataType() {
        return "vector(768)";
    },
    toDriver(value: number[]): string {
        return `[${value.join(",")}]`;
    },
    fromDriver(value: unknown): number[] {
        const str = value as string;
        return str
            .slice(1, -1)
            .split(",")
            .map(Number);
    },
});

// ── Enums ─────────────────────────────────────────────────────────────
export const pageStatusEnum = pgEnum("page_status", [
    "uploading",
    "processing",
    "completed",
    "failed",
]);

export const knowledgeUnitTypeEnum = pgEnum("knowledge_unit_type", [
    "task",
    "idea",
    "note",
    "question",
    "action_item",
]);

export const deviceTypeEnum = pgEnum("device_type", [
    "web",
    "mobile",
    "hardware",
]);

// ── Users ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique(),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("users_email_idx").on(table.email),
    index("users_created_at_idx").on(table.createdAt),
]);

// ── Pages ─────────────────────────────────────────────────────────────
export const pages = pgTable("pages", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    rawOcrText: text("raw_ocr_text"),
    cleanText: text("clean_text"),
    status: pageStatusEnum("status").default("uploading").notNull(),
    errorMessage: text("error_message"),
    embedding: vector("embedding"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("pages_user_id_idx").on(table.userId),
    index("pages_status_idx").on(table.status),
    index("pages_created_at_idx").on(table.createdAt),
]);

// ── Knowledge Units ───────────────────────────────────────────────────
export const knowledgeUnits = pgTable("knowledge_units", {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }).notNull(),
    type: knowledgeUnitTypeEnum("type").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("ku_page_id_idx").on(table.pageId),
    index("ku_type_idx").on(table.type),
    index("ku_created_at_idx").on(table.createdAt),
]);

// ── Tags ──────────────────────────────────────────────────────────────
export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("tags_name_idx").on(table.name),
]);

// ── Page Tags (junction) ─────────────────────────────────────────────
export const pageTags = pgTable("page_tags", {
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }).notNull(),
    tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
    primaryKey({ columns: [table.pageId, table.tagId] }),
]);

// ── Devices (future-proofing) ────────────────────────────────────────
export const devices = pgTable("devices", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: deviceTypeEnum("type").default("web").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index("devices_user_id_idx").on(table.userId),
]);

// ── Relations ─────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
    pages: many(pages),
    devices: many(devices),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
    user: one(users, { fields: [pages.userId], references: [users.id] }),
    knowledgeUnits: many(knowledgeUnits),
    pageTags: many(pageTags),
}));

export const knowledgeUnitsRelations = relations(knowledgeUnits, ({ one }) => ({
    page: one(pages, { fields: [knowledgeUnits.pageId], references: [pages.id] }),
}));

export const pageTagsRelations = relations(pageTags, ({ one }) => ({
    page: one(pages, { fields: [pageTags.pageId], references: [pages.id] }),
    tag: one(tags, { fields: [pageTags.tagId], references: [tags.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    pageTags: many(pageTags),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
    user: one(users, { fields: [devices.userId], references: [users.id] }),
}));
