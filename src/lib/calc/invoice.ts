// Single source of truth for invoice totals (blueprint section 6.2).
// Pure and integer-only: money in rupiah, qty x1000, rates in basis points.
// The calculation order below must not change.

export type DiscountType = 'none' | 'percent' | 'fixed'

export type InvoiceCalcItem = {
  qtyMilli: number
  unitPrice: number
}

export type InvoiceCalcInput = {
  items: readonly InvoiceCalcItem[]
  discountType: DiscountType
  /** Basis points when `percent`, rupiah when `fixed`. */
  discountValue: number
  taxRateBp: number
  dppNum: number
  dppDen: number
  shippingAmount: number
  shippingTaxable: boolean
}

export type InvoiceCalcResult = {
  lineTotals: number[]
  subtotal: number
  discountTotal: number
  net: number
  taxableBase: number
  dppAmount: number
  taxAmount: number
  grandTotal: number
}

const QTY_SCALE = BigInt(1000)
const BP_SCALE = BigInt(10000)
const ZERO = BigInt(0)
const TWO = BigInt(2)

function toBigInt(value: number, field: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative safe integer`)
  }
  return BigInt(value)
}

function toNumber(value: bigint, field: string): number {
  const result = Number(value)
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`${field} exceeds the safe integer range`)
  }
  return result
}

/** Half-up division for non-negative numerator and positive denominator. */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (TWO * numerator + denominator) / (TWO * denominator)
}

function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

export function calculateInvoice(input: InvoiceCalcInput): InvoiceCalcResult {
  const dppNum = toBigInt(input.dppNum, 'dppNum')
  const dppDen = toBigInt(input.dppDen, 'dppDen')
  if (dppDen === ZERO) {
    throw new RangeError('dppDen must be greater than zero')
  }
  const taxRateBp = toBigInt(input.taxRateBp, 'taxRateBp')
  const discountValue = toBigInt(input.discountValue, 'discountValue')
  const shipping = toBigInt(input.shippingAmount, 'shippingAmount')

  const lineTotals = input.items.map((item, index) =>
    divRoundHalfUp(
      toBigInt(item.qtyMilli, `items[${index}].qtyMilli`) *
        toBigInt(item.unitPrice, `items[${index}].unitPrice`),
      QTY_SCALE,
    ),
  )
  const subtotal = lineTotals.reduce((sum, lineTotal) => sum + lineTotal, ZERO)

  let rawDiscount = ZERO
  if (input.discountType === 'percent') {
    rawDiscount = divRoundHalfUp(subtotal * discountValue, BP_SCALE)
  } else if (input.discountType === 'fixed') {
    rawDiscount = discountValue
  }
  const discountTotal = minBigInt(rawDiscount, subtotal)

  const net = subtotal - discountTotal
  const taxableBase = net + (input.shippingTaxable ? shipping : ZERO)
  const dppAmount = divRoundHalfUp(taxableBase * dppNum, dppDen)
  const taxAmount = divRoundHalfUp(taxableBase * taxRateBp * dppNum, BP_SCALE * dppDen)
  const grandTotal = net + shipping + taxAmount

  return {
    lineTotals: lineTotals.map((lineTotal, index) => toNumber(lineTotal, `lineTotals[${index}]`)),
    subtotal: toNumber(subtotal, 'subtotal'),
    discountTotal: toNumber(discountTotal, 'discountTotal'),
    net: toNumber(net, 'net'),
    taxableBase: toNumber(taxableBase, 'taxableBase'),
    dppAmount: toNumber(dppAmount, 'dppAmount'),
    taxAmount: toNumber(taxAmount, 'taxAmount'),
    grandTotal: toNumber(grandTotal, 'grandTotal'),
  }
}
