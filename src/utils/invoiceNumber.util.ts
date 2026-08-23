/**
 * Generates a standard sequential invoice number.
 * Format: INV-YYYYMM-XXXXX (e.g., INV-202608-00001)
 */
export function generateInvoiceNumber(sequenceIndex: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequence = String(sequenceIndex).padStart(5, '0');
  return `INV-${year}${month}-${sequence}`;
}

/**
 * Extracts sequential number from an existing invoice number string if formatted as INV-YYYYMM-XXXXX
 */
export function parseInvoiceSequence(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/^INV-\d{6}-(\d+)$/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
