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
  classes: many(classTable),
  polls: many(poll),
}));

export const semesterRelations = relations(semester, ({ one, many }) => ({
  creator: one(user, {
    fields: [semester.createdBy],
    references: [user.id],
    relationName: "semesterCreator",
  }),
  users: many(user, { relationName: "userActiveSemester" }),
  rooms: many(attendanceRoom),
  classes: many(classTable),
  polls: many(poll),
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
  classId: integer("class_id").references(() => classTable.id),
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
    classItem: one(classTable, {
      fields: [attendanceRoom.classId],
      references: [classTable.id],
    }),
    records: many(attendanceRecord),
  }),
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
  }),
);

export const attendant = sqliteTable("attendant", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  uid: text("uid").notNull().unique(),
  email: text("email"),
  admin: integer("admin").references(() => user.id, { onDelete: "set null" }),
  walletAddress: text("wallet_address"),
});

export const attendantRelations = relations(attendant, ({ one, many }) => ({
  adminUser: one(user, {
    fields: [attendant.admin],
    references: [user.id],
  }),
  records: many(attendanceRecord),
  studentClasses: many(studentClass),
}));

export const poll = sqliteTable("poll", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  title: text("title").notNull(),
  description: text("description"),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  requireIdentification: integer("require_identification", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  createdBy: integer("created_by")
    .notNull()
    .references(() => user.id),
  semesterId: integer("semester_id").references(() => semester.id),
  classId: integer("class_id").references(() => classTable.id),
});

export const pollRelations = relations(poll, ({ one, many }) => ({
  creator: one(user, {
    fields: [poll.createdBy],
    references: [user.id],
  }),
  semester: one(semester, {
    fields: [poll.semesterId],
    references: [semester.id],
  }),
  classItem: one(classTable, {
    fields: [poll.classId],
    references: [classTable.id],
  }),
  questions: many(pollQuestion),
  responses: many(pollResponse),
}));

export const pollQuestion = sqliteTable("poll_question", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  pollId: integer("poll_id")
    .notNull()
    .references(() => poll.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type", {
    enum: ["SELECT", "MULTIPLE_CHOICE", "TEXT", "BOOLEAN"],
  }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isRequired: integer("is_required", { mode: "boolean" })
    .notNull()
    .default(true),
});

export const pollQuestionRelations = relations(
  pollQuestion,
  ({ one, many }) => ({
    poll: one(poll, {
      fields: [pollQuestion.pollId],
      references: [poll.id],
    }),
    options: many(pollQuestionOption),
    responses: many(pollResponse),
  }),
);

export const pollQuestionOption = sqliteTable("poll_question_option", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  questionId: integer("question_id")
    .notNull()
    .references(() => pollQuestion.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pollQuestionOptionRelations = relations(
  pollQuestionOption,
  ({ one, many }) => ({
    question: one(pollQuestion, {
      fields: [pollQuestionOption.questionId],
      references: [pollQuestion.id],
    }),
    responses: many(pollResponse),
  }),
);

export const pollResponse = sqliteTable("poll_response", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  pollId: integer("poll_id")
    .notNull()
    .references(() => poll.id),
  questionId: integer("question_id")
    .notNull()
    .references(() => pollQuestion.id),
  respondentId: text("respondent_id").notNull(),
  answerText: text("answer_text"),
  selectedOptionId: integer("selected_option_id").references(
    () => pollQuestionOption.id,
  ),
});

export const pollResponseRelations = relations(pollResponse, ({ one }) => ({
  poll: one(poll, {
    fields: [pollResponse.pollId],
    references: [poll.id],
  }),
  question: one(pollQuestion, {
    fields: [pollResponse.questionId],
    references: [pollQuestion.id],
  }),
  selectedOption: one(pollQuestionOption, {
    fields: [pollResponse.selectedOptionId],
    references: [pollQuestionOption.id],
  }),
}));

export const classTable = sqliteTable("class", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  name: text("name").notNull(),
  semesterId: integer("semester_id")
    .notNull()
    .references(() => semester.id),
  createdBy: integer("created_by")
    .notNull()
    .references(() => user.id),
});

export const classTableRelations = relations(classTable, ({ one, many }) => ({
  semester: one(semester, {
    fields: [classTable.semesterId],
    references: [semester.id],
  }),
  creator: one(user, {
    fields: [classTable.createdBy],
    references: [user.id],
  }),
  studentClasses: many(studentClass),
  rooms: many(attendanceRoom),
  polls: many(poll),
}));

export const studentClass = sqliteTable("student_class", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attendantId: integer("attendant_id")
    .notNull()
    .references(() => attendant.id, { onDelete: "cascade" }),
  classId: integer("class_id")
    .notNull()
    .references(() => classTable.id, { onDelete: "cascade" }),
});

export const studentClassRelations = relations(studentClass, ({ one }) => ({
  attendant: one(attendant, {
    fields: [studentClass.attendantId],
    references: [attendant.id],
  }),
  classItem: one(classTable, {
    fields: [studentClass.classId],
    references: [classTable.id],
  }),
}));
