import {
  calculateInvoiceTotals,
  formatCurrencyVND,
  formatNumber,
} from '../../src/utils/calculation.util';

describe('Calculation Utility Tests', () => {
  describe('calculateInvoiceTotals', () => {
    it('should calculate subtotal, taxAmount, and totalAmount correctly for standard 10% VAT', () => {
      const items = [
        { description: 'MacBook Pro M3', quantity: 2, unitPrice: 2000 },
        { description: 'Magic Mouse', quantity: 1, unitPrice: 100 },
      ];

      const result = calculateInvoiceTotals(items, 10);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].amount).toBe(4000);
      expect(result.items[1].amount).toBe(100);
      expect(result.subtotal).toBe(4100);
      expect(result.taxRate).toBe(10);
      expect(result.taxAmount).toBe(410);
      expect(result.totalAmount).toBe(4510);
    });

    it('should handle zero percent VAT correctly (0% tax)', () => {
      const items = [{ description: 'Software License', quantity: 1, unitPrice: 500 }];

      const result = calculateInvoiceTotals(items, 0);

      expect(result.subtotal).toBe(500);
      expect(result.taxRate).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(500);
    });

    it('should handle custom VAT rate (8%) and round decimals correctly', () => {
      const items = [
        { description: 'Consulting Services', quantity: 3, unitPrice: 33.33 },
      ];

      // 3 * 33.33 = 99.99
      // Tax: 99.99 * 0.08 = 7.9992 -> 8.00
      // Total: 99.99 + 8.00 = 107.99
      const result = calculateInvoiceTotals(items, 8);

      expect(result.subtotal).toBe(99.99);
      expect(result.taxRate).toBe(8);
      expect(result.taxAmount).toBe(8.0);
      expect(result.totalAmount).toBe(107.99);
    });

    it('should enforce minimum quantity of 1 and non-negative unit prices', () => {
      const items = [{ description: 'Test Item', quantity: 0, unitPrice: -50 }];

      const result = calculateInvoiceTotals(items, 10);

      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].unitPrice).toBe(0);
      expect(result.items[0].amount).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe('formatCurrencyVND', () => {
    it('should format VND currency with suffix and separators', () => {
      const formatted = formatCurrencyVND(1500000);
      expect(formatted).toMatch(/1\.500\.000/);
    });
  });

  describe('formatNumber', () => {
    it('should format standard number with 2 decimal places and commas', () => {
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
      expect(formatNumber(100)).toBe('100.00');
    });
  });
});
