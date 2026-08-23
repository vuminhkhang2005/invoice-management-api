import {
  generateInvoiceNumber,
  parseInvoiceSequence,
} from '../../src/utils/invoiceNumber.util';

describe('Invoice Number Utility Tests', () => {
  it('should generate formatted invoice number with padded sequence and year-month', () => {
    const fixedDate = new Date('2026-08-23T12:00:00Z');
    const invoiceNum = generateInvoiceNumber(1, fixedDate);
    expect(invoiceNum).toBe('INV-202608-00001');

    const invoiceNum123 = generateInvoiceNumber(123, fixedDate);
    expect(invoiceNum123).toBe('INV-202608-00123');
  });

  it('should parse sequence integer from formatted invoice number', () => {
    expect(parseInvoiceSequence('INV-202608-00042')).toBe(42);
    expect(parseInvoiceSequence('INVALID-FORMAT')).toBeNull();
  });
});
