import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const semester = sqliteTable("semester", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdBy: integer("created_by").notNull(),
});

export const user = sqliteTable("user", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role", { enum: ["ADMIN", "USER"] })
    .notNull()
    .default("USER"),
  semesterId: integer("semester_id").references(() => semester.id),
});

export const userRelations = relations(user, ({ many, one }) => ({
  attendants: many(attendant),
  rooms: many(attendanceRoom),
  activeSemester: one(semester, {
    fields: [user.semesterId],
    references: [semester.id],
    relationName: "userActiveSemester",
  }),
  createdSemesters: many(semester, { relationName: "semesterCreator" }),
}));

export const semesterRelations = relations(semester, ({ one, many }) => ({
  creator: one(user, {
    fields: [semester.createdBy],
    references: [user.id],
    relationName: "semesterCreator",
  }),
  users: many(user, { relationName: "userActiveSemester" }),
  rooms: many(attendanceRoom),
}));

export const attendanceRoom = sqliteTable("attendance_room", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  alias: text("alias").notNull(),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by")
    .notNull()
    .references(() => user.id),
  semesterId: integer("semester_id").references(() => semester.id),
});

export const attendanceRoomRelations = relations(
  attendanceRoom,
  ({ one, many }) => ({
    creator: one(user, {
      fields: [attendanceRoom.createdBy],
      references: [user.id],
    }),
    semester: one(semester, {
      fields: [attendanceRoom.semesterId],
      references: [semester.id],
    }),
    records: many(attendanceRecord),
  })
);

export const attendanceRecord = sqliteTable("attendance_record", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  attendantId: integer("attendant_id")
    .notNull()
    .references(() => attendant.id),
  attendanceRoomId: integer("attendance_room_id")
    .notNull()
    .references(() => attendanceRoom.id),
});

export const attendanceRecordRelations = relations(
  attendanceRecord,
  ({ one }) => ({
    attendant: one(attendant, {
      fields: [attendanceRecord.attendantId],
      references: [attendant.id],
    }),
    attendanceRoom: one(attendanceRoom, {
      fields: [attendanceRecord.attendanceRoomId],
      references: [attendanceRoom.id],
    }),
  })
);

export const attendant = sqliteTable("attendant", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  uid: text("uid").notNull().unique(),
  admin: integer("admin").references(() => user.id, { onDelete: "set null" }),
  walletAddress: text("wallet_address"),
});

export const attendantRelations = relations(attendant, ({ one, many }) => ({
  adminUser: one(user, {
    fields: [attendant.admin],
    references: [user.id],
  }),
  records: many(attendanceRecord),
}));
