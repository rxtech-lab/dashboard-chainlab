import { pgTable, serial, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum for Role
export const roleEnum = pgEnum("Role", ["ADMIN", "USER"]);

// User table
export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  walletAddress: text("wallet_address").notNull().unique(),
  role: roleEnum("role").notNull().default("USER"),
});

// AttendanceRoom table
export const attendanceRoom = pgTable("attendance_room", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  alias: text("alias").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  createdBy: integer("created_by").notNull().references(() => user.id),
});

// Attendant table
export const attendant = pgTable("attendant", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  uid: text("uid").notNull().unique(),
  admin: integer("admin").references(() => user.id),
  walletAddress: text("wallet_address"),
});

// AttendanceRecord table
export const attendanceRecord = pgTable("attendance_record", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  attendantId: integer("attendant_id").notNull().references(() => attendant.id),
  attendanceRoomId: integer("attendance_room_id").notNull().references(() => attendanceRoom.id),
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
  attendants: many(attendant),
  rooms: many(attendanceRoom),
}));

export const attendanceRoomRelations = relations(attendanceRoom, ({ one, many }) => ({
  creator: one(user, {
    fields: [attendanceRoom.createdBy],
    references: [user.id],
  }),
  records: many(attendanceRecord),
}));

export const attendantRelations = relations(attendant, ({ one, many }) => ({
  adminUser: one(user, {
    fields: [attendant.admin],
    references: [user.id],
  }),
  records: many(attendanceRecord),
}));

export const attendanceRecordRelations = relations(attendanceRecord, ({ one }) => ({
  attendant: one(attendant, {
    fields: [attendanceRecord.attendantId],
    references: [attendant.id],
  }),
  attendanceRoom: one(attendanceRoom, {
    fields: [attendanceRecord.attendanceRoomId],
    references: [attendanceRoom.id],
  }),
}));
