export interface CalculatedItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Calculates subtotal, taxAmount, and totalAmount for an invoice based on items and taxRate.
 */
export function calculateInvoiceTotals(
  items: Array<{ description: string; quantity: number; unitPrice: number }>,
  taxRate = 10
): CalculationResult {
  const calculatedItems: CalculatedItem[] = items.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    const price = Math.max(0, Number(item.unitPrice));
    const amount = Number((qty * price).toFixed(2));
    return {
      description: item.description.trim(),
      quantity: qty,
      unitPrice: price,
      amount,
    };
  });

  const subtotal = Number(
    calculatedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
  );

  const rate = Math.max(0, Number(taxRate));
  const taxAmount = Number(((subtotal * rate) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  return {
    items: calculatedItems,
    subtotal,
    taxRate: rate,
    taxAmount,
    totalAmount,
  };
}

/**
 * Formats currency amount as VND (e.g. 1,000,000 đ)
 */
export function formatCurrencyVND(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats standard decimal number with commas (e.g. 1,234.56)
 */
export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
