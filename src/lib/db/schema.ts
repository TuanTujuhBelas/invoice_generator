// Drizzle schema for D1 (SQLite), mirrors blueprint section 5.3.
// TS camelCase keys map to snake_case columns via `casing: 'snake_case'`.
// Money: INTEGER rupiah. Quantity: INTEGER x1000. Percent: basis points.
// Business dates: TEXT YYYY-MM-DD. System timestamps: TEXT ISO-8601 UTC.
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'

export const CONTACT_TYPES = ['sender', 'client'] as const
export const INVOICE_STATUSES = [
  'draft',
  'issued',
  'sent',
  'partially_paid',
  'paid',
  'void',
] as const
export const DISCOUNT_TYPES = ['none', 'percent', 'fixed'] as const
export const PDF_STATUSES = ['none', 'pending', 'ready', 'failed'] as const
export const EMAIL_DELIVERY_STATUSES = ['queued', 'sent', 'failed', 'bounced'] as const
export const LOG_SOURCES = ['server', 'client', 'cron'] as const
export const LOG_LEVELS = ['info', 'warn', 'error'] as const
export const LOG_STATUSES = ['started', 'success', 'failed'] as const
export const EXPORT_KINDS = ['xlsx', 'csv', 'json', 'zip'] as const
export const EXPORT_SCOPES = ['single', 'selected', 'filtered', 'all'] as const

const inList = (values: readonly string[]) =>
  sql.raw(values.map((value) => `'${value}'`).join(','))

export const organizations = sqliteTable('organizations', {
  id: text().primaryKey(),
  name: text().notNull(),
  npwp: text(),
  address: text(),
  logoKey: text(),
  defaultTemplateId: text(),
  createdAt: text().notNull(),
})

export const contacts = sqliteTable(
  'contacts',
  {
    id: text().primaryKey(),
    orgId: text()
      .notNull()
      .references(() => organizations.id),
    type: text({ enum: CONTACT_TYPES }).notNull(),
    name: text().notNull(),
    email: text(),
    phone: text(),
    address: text(),
    npwp: text(),
    isArchived: integer({ mode: 'boolean' }).notNull().default(false),
    createdAt: text().notNull(),
    updatedAt: text().notNull(),
  },
  (t) => [
    check('contacts_type_check', sql`${t.type} IN (${inList(CONTACT_TYPES)})`),
    index('idx_contacts_org_type').on(t.orgId, t.type, t.isArchived),
  ],
)

export const templates = sqliteTable('templates', {
  id: text().primaryKey(),
  orgId: text()
    .notNull()
    .references(() => organizations.id),
  name: text().notNull(),
  currentVersion: integer().notNull().default(1),
  isArchived: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: text().notNull(),
})

export const templateVersions = sqliteTable(
  'template_versions',
  {
    id: text().primaryKey(),
    templateId: text()
      .notNull()
      .references(() => templates.id),
    version: integer().notNull(),
    schemaJson: text().notNull(),
    backgroundKey: text(),
    createdAt: text().notNull(),
  },
  (t) => [unique('template_versions_template_version_unique').on(t.templateId, t.version)],
)

export const numberSequences = sqliteTable(
  'number_sequences',
  {
    orgId: text().notNull(),
    scope: text().notNull(),
    lastValue: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.scope] })],
)

export const invoices = sqliteTable(
  'invoices',
  {
    id: text().primaryKey(),
    orgId: text()
      .notNull()
      .references(() => organizations.id),
    number: text(),
    status: text({ enum: INVOICE_STATUSES }).notNull(),
    issueDate: text(),
    dueDate: text(),
    currency: text().notNull().default('IDR'),
    templateVersionId: text().references(() => templateVersions.id),
    clientId: text().references(() => contacts.id),
    senderSnapshot: text(),
    clientSnapshot: text(),
    discountType: text({ enum: DISCOUNT_TYPES }).notNull().default('none'),
    discountValue: integer().notNull().default(0),
    taxRateBp: integer().notNull().default(1200),
    dppNum: integer().notNull().default(11),
    dppDen: integer().notNull().default(12),
    shippingAmount: integer().notNull().default(0),
    shippingTaxable: integer({ mode: 'boolean' }).notNull().default(false),
    subtotal: integer().notNull().default(0),
    discountTotal: integer().notNull().default(0),
    dppAmount: integer().notNull().default(0),
    taxAmount: integer().notNull().default(0),
    grandTotal: integer().notNull().default(0),
    amountPaid: integer().notNull().default(0),
    notes: text(),
    logoKey: text(),
    signatureKey: text(),
    fakturPajakNumber: text(),
    pdfStatus: text({ enum: PDF_STATUSES }).notNull().default('none'),
    version: integer().notNull().default(1),
    issuedAt: text(),
    voidedAt: text(),
    voidReason: text(),
    createdAt: text().notNull(),
    updatedAt: text().notNull(),
  },
  (t) => [
    check('invoices_status_check', sql`${t.status} IN (${inList(INVOICE_STATUSES)})`),
    check(
      'invoices_discount_type_check',
      sql`${t.discountType} IN (${inList(DISCOUNT_TYPES)})`,
    ),
    check('invoices_pdf_status_check', sql`${t.pdfStatus} IN (${inList(PDF_STATUSES)})`),
    unique('invoices_org_number_unique').on(t.orgId, t.number),
    index('idx_invoices_org_status').on(t.orgId, t.status, t.issueDate),
    index('idx_invoices_org_client').on(t.orgId, t.clientId),
    index('idx_invoices_org_due').on(t.orgId, t.dueDate),
  ],
)

export const invoiceItems = sqliteTable(
  'invoice_items',
  {
    id: text().primaryKey(),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    sortOrder: integer().notNull(),
    description: text().notNull(),
    unit: text(),
    qtyMilli: integer().notNull(),
    unitPrice: integer().notNull(),
    lineTotal: integer().notNull(),
  },
  (t) => [
    check('invoice_items_qty_check', sql`${t.qtyMilli} > 0`),
    check('invoice_items_unit_price_check', sql`${t.unitPrice} >= 0`),
    index('idx_items_invoice').on(t.invoiceId, t.sortOrder),
  ],
)

export const invoiceFiles = sqliteTable('invoice_files', {
  id: text().primaryKey(),
  invoiceId: text()
    .notNull()
    .references(() => invoices.id),
  kind: text().notNull().default('pdf'),
  r2Key: text().notNull(),
  sha256: text().notNull(),
  sizeBytes: integer().notNull(),
  renderMs: integer(),
  createdAt: text().notNull(),
})

export const payments = sqliteTable(
  'payments',
  {
    id: text().primaryKey(),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id),
    amount: integer().notNull(),
    paidAt: text().notNull(),
    method: text(),
    note: text(),
    createdAt: text().notNull(),
  },
  (t) => [check('payments_amount_check', sql`${t.amount} > 0`)],
)

export const emailDeliveries = sqliteTable(
  'email_deliveries',
  {
    id: text().primaryKey(),
    invoiceId: text()
      .notNull()
      .references(() => invoices.id),
    toEmail: text().notNull(),
    providerMessageId: text(),
    status: text({ enum: EMAIL_DELIVERY_STATUSES }).notNull(),
    errorMessage: text(),
    createdAt: text().notNull(),
  },
  (t) => [
    check(
      'email_deliveries_status_check',
      sql`${t.status} IN (${inList(EMAIL_DELIVERY_STATUSES)})`,
    ),
  ],
)

export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: text().primaryKey(),
    orgId: text().notNull(),
    ts: text().notNull(),
    correlationId: text().notNull(),
    actor: text().notNull(),
    source: text({ enum: LOG_SOURCES }).notNull(),
    level: text({ enum: LOG_LEVELS }).notNull(),
    event: text().notNull(),
    entityType: text(),
    entityId: text(),
    status: text({ enum: LOG_STATUSES }).notNull(),
    durationMs: integer(),
    errorCode: text(),
    errorMessage: text(),
    metadata: text(),
  },
  (t) => [
    check('activity_logs_source_check', sql`${t.source} IN (${inList(LOG_SOURCES)})`),
    check('activity_logs_level_check', sql`${t.level} IN (${inList(LOG_LEVELS)})`),
    check('activity_logs_status_check', sql`${t.status} IN (${inList(LOG_STATUSES)})`),
    index('idx_logs_entity').on(t.entityType, t.entityId, t.ts),
    index('idx_logs_level_ts').on(t.level, t.ts),
    index('idx_logs_correlation').on(t.correlationId),
  ],
)

export const idempotencyKeys = sqliteTable('idempotency_keys', {
  key: text().primaryKey(),
  responseJson: text().notNull(),
  createdAt: text().notNull(),
})

export const exports = sqliteTable(
  'exports',
  {
    id: text().primaryKey(),
    orgId: text().notNull(),
    kind: text({ enum: EXPORT_KINDS }).notNull(),
    scope: text({ enum: EXPORT_SCOPES }).notNull(),
    filtersJson: text(),
    rowCount: integer(),
    r2Key: text(),
    createdAt: text().notNull(),
  },
  (t) => [
    check('exports_kind_check', sql`${t.kind} IN (${inList(EXPORT_KINDS)})`),
    check('exports_scope_check', sql`${t.scope} IN (${inList(EXPORT_SCOPES)})`),
  ],
)

export type Organization = typeof organizations.$inferSelect
export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
export type Template = typeof templates.$inferSelect
export type TemplateVersion = typeof templateVersions.$inferSelect
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type InvoiceItem = typeof invoiceItems.$inferSelect
export type NewInvoiceItem = typeof invoiceItems.$inferInsert
export type InvoiceFile = typeof invoiceFiles.$inferSelect
export type Payment = typeof payments.$inferSelect
export type EmailDelivery = typeof emailDeliveries.$inferSelect
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect
export type ExportRecord = typeof exports.$inferSelect
