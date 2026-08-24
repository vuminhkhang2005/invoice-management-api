import { EmailService } from '../../src/services/email.service';
import { InvoiceStatus } from '../../src/constants/invoice.constant';
import { BadRequestError } from '../../src/errors/appError';

describe('EmailService Unit Tests', () => {
  let emailService: EmailService;
  let mockPdfService: any;
  let mockTransporter: any;

  beforeEach(() => {
    mockPdfService = {
      generateInvoicePdfBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Mock PDF')),
    };

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: '<test-message-id-1234@invoicetech.vn>',
      }),
    };

    emailService = new EmailService(mockPdfService, mockTransporter);
  });

  it('should send invoice email with PDF attachment and responsive HTML', async () => {
    const sampleInvoice: any = {
      id: 'inv-123',
      invoiceNumber: 'INV-202608-00001',
      status: InvoiceStatus.ISSUED,
      customerName: 'ACME Corp',
      customerEmail: 'billing@acme.com',
      totalAmount: 1500000,
      issuedAt: new Date(),
    };

    const result = await emailService.sendInvoiceEmail(sampleInvoice);

    expect(mockPdfService.generateInvoicePdfBuffer).toHaveBeenCalledWith(sampleInvoice);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.recipient).toBe('billing@acme.com');
  });

  it('should allow overriding recipient email', async () => {
    const sampleInvoice: any = {
      id: 'inv-123',
      invoiceNumber: 'INV-202608-00001',
      status: InvoiceStatus.ISSUED,
      customerName: 'ACME Corp',
      customerEmail: 'original@acme.com',
      totalAmount: 1500000,
    };

    const result = await emailService.sendInvoiceEmail(sampleInvoice, 'custom@acme.com');
    expect(result.recipient).toBe('custom@acme.com');
  });

  it('should throw BadRequestError if no email address is available', async () => {
    const sampleInvoice: any = {
      id: 'inv-123',
      invoiceNumber: 'INV-202608-00001',
      status: InvoiceStatus.ISSUED,
      customerName: 'ACME Corp',
      customerEmail: null,
      totalAmount: 1500000,
    };

    await expect(emailService.sendInvoiceEmail(sampleInvoice)).rejects.toThrow(
      BadRequestError
    );
  });
});
