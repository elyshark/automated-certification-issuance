import { relations, sql, eq, and, lte, gte } from "drizzle-orm";
import {
  pgTable,
  pgView,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  type AnyPgColumn,
  decimal,
} from "drizzle-orm/pg-core";

export const employee = pgTable("employee", {
  id: serial("id").primaryKey(),
  givenName: text("given_name").notNull(),
  surname: text("surname").notNull(),
  email: text("email").notNull().unique(),
  position: text("position").notNull(),
  role: varchar("role", { length: 13, enum: ["USER", "REVIEWER", "ADMINISTRATOR"] })
    .notNull()
    .default("USER"),
});

export const training = pgTable("training", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
});

export const location = pgTable("location", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
});

export const certificate = pgTable("certificate", {
  id: varchar("id", { length: 12 }).primaryKey(),
  path: varchar("path", { length: 256 }).notNull(),
  issuedDate: timestamp("issued_date", { withTimezone: true }).defaultNow().notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }), // default issued_date + 24 months have to be added manually
  // because drizzle only supports stateless defaults
  // check the generated migration sql
  // for the manually-written function
  employeeId: integer("issued_to")
    .references(() => employee.id, { onDelete: "cascade" })
    .notNull(),
});

export const trainingHistory = pgTable("training_history", {
  id: serial("id").primaryKey(),
  trainingCode: varchar("training_code", { length: 3 })
    .references(() => training.code, { onDelete: "cascade" })
    .notNull(),
  traineeId: integer("trainee_id")
    .references(() => employee.id, { onDelete: "cascade" })
    .notNull(),
  locationCode: varchar("location_code", { length: 3 })
    .notNull()
    .references(() => location.code),
  trainingDate: timestamp("training_date", { withTimezone: true }).notNull(),
  reviewedDate: timestamp("reviewed_date", { withTimezone: true }),
  certificateId: varchar("certificate_id", { length: 12 })
    .references(() => certificate.id)
    .unique(),
  reviewerId: integer("reviewer_id").references(() => employee.id, { onDelete: "set null" }),
  status: varchar("status", { length: 8, enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull(),
  remarks: text("remarks"),
  renewedFromId: integer("renewed_from_id").references((): AnyPgColumn => trainingHistory.id),
});

export const employeeRelations = relations(employee, ({ many }) => ({
  trainingHistories: many(trainingHistory, { relationName: "trainee" }),
  reviewedHistories: many(trainingHistory, { relationName: "reviewer" }),
  certificates: many(certificate),
}));

export const trainingRelations = relations(training, ({ many }) => ({
  trainingHistories: many(trainingHistory),
}));

export const certificateRelations = relations(certificate, ({ one }) => ({
  employee: one(employee, {
    fields: [certificate.employeeId],
    references: [employee.id],
  }),
}));

export const trainingHistoryRelations = relations(trainingHistory, ({ one }) => ({
  training: one(training, {
    fields: [trainingHistory.trainingCode],
    references: [training.code],
  }),
  trainee: one(employee, {
    fields: [trainingHistory.traineeId],
    references: [employee.id],
    relationName: "trainee",
  }),
  reviewer: one(employee, {
    fields: [trainingHistory.reviewerId],
    references: [employee.id],
    relationName: "reviewer",
  }),
  location: one(location, {
    fields: [trainingHistory.locationCode],
    references: [location.code],
  }),
  certificate: one(certificate, {
    fields: [trainingHistory.certificateId],
    references: [certificate.id],
  }),
  renewedFrom: one(trainingHistory, {
    fields: [trainingHistory.renewedFromId],
    references: [trainingHistory.id],
  }),
}));

export const upcomingRenewalsView = pgView("upcoming_renewals").as((qb) =>
  qb
    .select({
      email: employee.email,
      givenName: employee.givenName,
      surname: employee.surname,
      trainingName: training.name,
      expiryDate: certificate.expiryDate,
      certificateId: certificate.id,
    })
    .from(certificate)
    .innerJoin(employee, eq(certificate.employeeId, employee.id))
    .innerJoin(trainingHistory, eq(trainingHistory.certificateId, certificate.id))
    .innerJoin(training, eq(trainingHistory.trainingCode, training.code))
    .where(
      and(
        lte(certificate.expiryDate, sql`CURRENT_DATE + INTERVAL '90 days'`),
        gte(certificate.expiryDate, sql`CURRENT_DATE`),
      ),
    ),
);

export * from "./auth.schema";
