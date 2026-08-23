import {
  generateQrCodeBuffer,
  buildInvoiceQrPayload,
} from '../../src/utils/qrCode.util';

describe('QR Code Utility Tests', () => {
  it('should build formatted JSON verification payload string', () => {
    const payload = buildInvoiceQrPayload(
      'uuid-1234',
      'INV-202608-00001',
      1500000,
      'Test Company'
    );

    const parsed = JSON.parse(payload);
    expect(parsed.type).toBe('E-INVOICE-VERIFICATION');
    expect(parsed.invoiceNumber).toBe('INV-202608-00001');
    expect(parsed.invoiceId).toBe('uuid-1234');
    expect(parsed.amount).toBe(1500000);
  });

  it('should generate a valid PNG image buffer from text', async () => {
    const buffer = await generateQrCodeBuffer('https://example.com/invoice/123');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    // PNG signature begins with 0x89 0x50 0x4E 0x47 (‰PNG)
    expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  });
});
