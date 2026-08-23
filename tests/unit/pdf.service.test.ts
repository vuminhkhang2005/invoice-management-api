import { PdfService, InvoicePdfData } from '../../src/services/pdf.service';
import { InvoiceStatus } from '../../src/constants/invoice.constant';

describe('PdfService Unit Tests', () => {
  let pdfService: PdfService;

  beforeEach(() => {
    pdfService = new PdfService();
  });

  const baseInvoice: InvoicePdfData = {
    id: 'test-uuid-1234',
    invoiceNumber: 'INV-202608-00001',
    status: InvoiceStatus.ISSUED,
    customerName: 'ACME Software Corp',
    customerEmail: 'finance@acme.com',
    customerAddress: '123 Tech Street, District 1, HCMC',
    customerTaxCode: '0312345678',
    subtotal: 1000000,
    taxRate: 10,
    taxAmount: 100000,
    totalAmount: 1100000,
    notes: 'Payment net 15 days',
    issuedAt: new Date(),
    items: [
      {
        description: 'Cloud Server Enterprise Plan (1 Month)',
        quantity: 1,
        unitPrice: 1000000,
        amount: 1000000,
      },
    ],
  };

  it('should generate a valid PDF buffer for an ISSUED invoice', async () => {
    const buffer = await pdfService.generateInvoicePdfBuffer(baseInvoice);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF signature begins with %PDF-
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should generate a valid PDF buffer for a DRAFT invoice with draft watermark', async () => {
    const draftInvoice: InvoicePdfData = {
      ...baseInvoice,
      invoiceNumber: null,
      status: InvoiceStatus.DRAFT,
      issuedAt: null,
    };

    const buffer = await pdfService.generateInvoicePdfBuffer(draftInvoice);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should generate a valid PDF buffer for a CANCELED invoice with canceled watermark', async () => {
    const canceledInvoice: InvoicePdfData = {
      ...baseInvoice,
      status: InvoiceStatus.CANCELED,
      cancelReason: 'Customer canceled subscription',
      canceledAt: new Date(),
    };

    const buffer = await pdfService.generateInvoicePdfBuffer(canceledInvoice);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should generate a valid PDF buffer for a REPLACED invoice with replacement notice', async () => {
    const replacedInvoice: InvoicePdfData = {
      ...baseInvoice,
      status: InvoiceStatus.REPLACED,
      replacedInvoice: {
        id: 'old-inv-id',
        invoiceNumber: 'INV-202608-00000',
        issuedAt: new Date('2026-08-01'),
        totalAmount: 500000,
      },
    };

    const buffer = await pdfService.generateInvoicePdfBuffer(replacedInvoice);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
