import { z } from 'zod'

const MoneySchema = z.number().int().nonnegative()

export const InvoiceItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  unit: z.string().trim().max(32).nullable().optional(),
  qtyMilli: z.number().int().positive(),
  unitPrice: MoneySchema,
})

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>

export const InvoiceTotalsInputSchema = z
  .object({
    discountType: z.enum(['none', 'percent', 'fixed']),
    discountValue: MoneySchema,
    taxRateBp: z.number().int().min(0).max(10000),
    dppNum: z.number().int().positive(),
    dppDen: z.number().int().positive(),
    shippingAmount: MoneySchema,
    shippingTaxable: z.boolean(),
  })
  .refine((input) => input.discountType !== 'percent' || input.discountValue <= 10000, {
    message: 'Percent discount cannot exceed 100%',
    path: ['discountValue'],
  })

export type InvoiceTotalsInput = z.infer<typeof InvoiceTotalsInputSchema>

export const InvoiceIssueItemsSchema = z
  .array(InvoiceItemSchema)
  .min(1, 'Invoice must have at least one item before it can be issued')

export type InvoiceIssueItemsInput = z.infer<typeof InvoiceIssueItemsSchema>
