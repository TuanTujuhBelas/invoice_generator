import { describe, expect, it } from 'vitest'
import { InvoiceIssueItemsSchema } from '../validation/invoice'
import { calculateInvoice, type InvoiceCalcInput } from './invoice'

const baseInput: InvoiceCalcInput = {
  items: [],
  discountType: 'none',
  discountValue: 0,
  taxRateBp: 1200,
  dppNum: 11,
  dppDen: 12,
  shippingAmount: 0,
  shippingTaxable: false,
}

const oneItem = (unitPrice: number, qtyMilli = 1000) => [{ qtyMilli, unitPrice }]

describe('calculateInvoice', () => {
  it('T1 calculates DPP nilai lain 11/12 for non-luxury goods', () => {
    const totals = calculateInvoice({ ...baseInput, items: oneItem(10_000_000) })
    expect(totals.dppAmount).toBe(9_166_667)
    expect(totals.taxAmount).toBe(1_100_000)
    expect(totals.grandTotal).toBe(11_100_000)
  })

  it('T2 applies full 12% for luxury goods with DPP 12/12', () => {
    const totals = calculateInvoice({
      ...baseInput,
      items: oneItem(10_000_000),
      dppNum: 12,
      dppDen: 12,
    })
    expect(totals.dppAmount).toBe(10_000_000)
    expect(totals.taxAmount).toBe(1_200_000)
    expect(totals.grandTotal).toBe(11_200_000)
  })

  it('T3 rounds decimal quantity line totals half-up', () => {
    const totals = calculateInvoice({ ...baseInput, items: oneItem(333_333, 1500) })
    expect(totals.lineTotals).toEqual([500_000])
  })

  it('T4 applies a percent discount in basis points', () => {
    const totals = calculateInvoice({
      ...baseInput,
      items: oneItem(1_000_000),
      discountType: 'percent',
      discountValue: 1000,
    })
    expect(totals.discountTotal).toBe(100_000)
    expect(totals.net).toBe(900_000)
  })

  it('T5 caps a fixed discount at the subtotal', () => {
    const totals = calculateInvoice({
      ...baseInput,
      items: oneItem(1_000_000),
      discountType: 'fixed',
      discountValue: 2_000_000,
    })
    expect(totals.discountTotal).toBe(1_000_000)
    expect(totals.net).toBe(0)
    expect(totals.grandTotal).toBeGreaterThanOrEqual(0)
  })

  it('T6 includes taxable shipping in the tax base', () => {
    const totals = calculateInvoice({
      ...baseInput,
      items: oneItem(1_000_000),
      shippingAmount: 100_000,
      shippingTaxable: true,
    })
    expect(totals.taxableBase).toBe(1_100_000)
    expect(totals.taxAmount).toBe(121_000)
    expect(totals.grandTotal).toBe(1_221_000)
  })

  it('T7 adds non-taxable shipping after tax', () => {
    const totals = calculateInvoice({
      ...baseInput,
      items: oneItem(1_000_000),
      shippingAmount: 100_000,
      shippingTaxable: false,
    })
    expect(totals.taxableBase).toBe(1_000_000)
    expect(totals.taxAmount).toBe(110_000)
    expect(totals.grandTotal).toBe(1_210_000)
  })

  it('T8 produces zero tax when the tax rate is zero', () => {
    const totals = calculateInvoice({ ...baseInput, items: oneItem(1_000_000), taxRateBp: 0 })
    expect(totals.taxAmount).toBe(0)
    expect(totals.grandTotal).toBe(1_000_000)
  })

  it('T9 handles large values without overflow', () => {
    const totals = calculateInvoice({ ...baseInput, items: oneItem(999_999_999, 999_000) })
    expect(totals.subtotal).toBe(998_999_999_001)
    expect(totals.taxAmount).toBe(109_889_999_890)
    expect(totals.grandTotal).toBe(1_108_889_998_891)
  })

  it('T10 rejects issuing an invoice with no items', () => {
    expect(InvoiceIssueItemsSchema.safeParse([]).success).toBe(false)
    expect(calculateInvoice(baseInput).grandTotal).toBe(0)
  })

  it('rounds tax once from the full fraction, not from rounded DPP', () => {
    const totals = calculateInvoice({ ...baseInput, items: oneItem(32) })
    expect(totals.dppAmount).toBe(29)
    expect(totals.taxAmount).toBe(4)
  })

  it('rejects negative or fractional inputs', () => {
    expect(() => calculateInvoice({ ...baseInput, items: oneItem(-1) })).toThrow(RangeError)
    expect(() => calculateInvoice({ ...baseInput, items: oneItem(1.5) })).toThrow(RangeError)
    expect(() => calculateInvoice({ ...baseInput, dppDen: 0 })).toThrow(RangeError)
  })
})
