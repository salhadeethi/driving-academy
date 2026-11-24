import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums for consistent status values
export const studentStatusEnum = pgEnum('student_status', [
  'active',
  'graduated',
  'deactivated',
  'paused',
]);

export const appointmentTypeEnum = pgEnum('appointment_type', [
  'standard_lesson',
  'road_test',
]);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'paid',
  'pending',
  'refunded',
]);

export const instructors = pgTable('instructors', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(), // <-- Add this column
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  bio: text('bio'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Student Table
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  permitNumber: varchar('permit_number', { length: 50 }),
  dateOfBirth: varchar('date_of_birth', { length: 20 }),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  accountStatus: studentStatusEnum('account_status').default('active').notNull(),
  deactivatedAt: timestamp('deactivated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Student Package Table (Tracks remaining hours & road test credits)
export const studentPackages = pgTable('student_packages', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'restrict' })
    .notNull(),
  packageName: varchar('package_name', { length: 150 }).notNull(),
  totalHours: numeric('total_hours', { precision: 5, scale: 2 }).notNull(),
  remainingHours: numeric('remaining_hours', { precision: 5, scale: 2 }).notNull(),
  includesRoadTest: boolean('includes_road_test').default(false).notNull(),
  roadTestUsed: boolean('road_test_used').default(false).notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  expiryDate: timestamp('expiry_date'),
});

// 4. Appointment Table (Lessons & Road Tests)
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  instructorId: integer('instructor_id')
    .references(() => instructors.id, { onDelete: 'restrict' })
    .notNull(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'restrict' })
    .notNull(),
  packageId: integer('package_id').references(() => studentPackages.id, {
    onDelete: 'set null',
  }),
  appointmentType: appointmentTypeEnum('appointment_type')
    .default('standard_lesson')
    .notNull(),
  durationHours: numeric('duration_hours', { precision: 4, scale: 2 }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: appointmentStatusEnum('status').default('scheduled').notNull(),
  pickupLocation: text('pickup_location').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Payment Table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'restrict' })
    .notNull(),
  appointmentId: integer('appointment_id').references(() => appointments.id, {
    onDelete: 'set null',
  }),
  packageId: integer('package_id').references(() => studentPackages.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // e.g., 'card', 'etransfer', 'cash'
  paymentStatus: paymentStatusEnum('payment_status').default('paid').notNull(),
  paymentDate: timestamp('payment_date').defaultNow().notNull(),
});