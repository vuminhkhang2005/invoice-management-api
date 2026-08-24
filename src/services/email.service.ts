import nodemailer, { Transporter } from 'nodemailer';
import { COMPANY_INFO } from '../constants/invoice.constant';
import { BadRequestError } from '../errors/appError';
import { formatCurrencyVND } from '../utils/calculation.util';
import { numberToWordsVN } from '../utils/numberToWordsVN.util';
import { PdfService, InvoicePdfData } from './pdf.service';

export interface SendInvoiceEmailResult {
  success: boolean;
  messageId: string;
  recipient: string;
  previewUrl?: string | false;
}

export class EmailService {
  private transporter: Transporter;
  private pdfService: PdfService;

  constructor(pdfService = new PdfService(), customTransporter?: Transporter) {
    this.pdfService = pdfService;

    if (customTransporter) {
      this.transporter = customTransporter;
    } else {
      // Default to JSON transport for testing, or SMTP if configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback test/development transporter (in-memory / test stream)
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }
  }

  /**
   * Generates invoice PDF and emails it to the customer with a responsive HTML template.
   */
  async sendInvoiceEmail(
    invoice: InvoicePdfData,
    targetEmail?: string
  ): Promise<SendInvoiceEmailResult> {
    const recipient = targetEmail || invoice.customerEmail;

    if (!recipient) {
      throw new BadRequestError(
        'Recipient email is missing. Please provide an email address or update customer email.'
      );
    }

    // 1. Generate Vector PDF Buffer
    const pdfBuffer = await this.pdfService.generateInvoicePdfBuffer(invoice);
    const filename = `${invoice.invoiceNumber || 'INVOICE'}_${invoice.id.slice(0, 8)}.pdf`;

    // 2. Format details for Email template
    const formattedTotal = formatCurrencyVND(invoice.totalAmount);
    const totalInWords = numberToWordsVN(Number(invoice.totalAmount));
    const issueDateStr = invoice.issuedAt
      ? new Date(invoice.issuedAt).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');

    // 3. Render Responsive HTML Email Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hoá đơn điện tử ${invoice.invoiceNumber || invoice.id}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #F8FAFC; color: #1E293B; }
    .container { max-width: 600px; margin: 20px auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); color: #FFFFFF; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
    .content { padding: 24px; }
    .greeting { font-size: 15px; margin-bottom: 16px; line-height: 1.5; }
    .card { background-color: #F1F5F9; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { color: #64748B; font-weight: 500; }
    .card-value { font-weight: bold; color: #0F172A; text-align: right; }
    .total-banner { background-color: #DCFCE7; border: 1px solid #86EFAC; border-radius: 6px; padding: 14px; text-align: center; margin: 16px 0; }
    .total-amount { font-size: 20px; font-weight: bold; color: #15803D; margin-top: 4px; }
    .in-words { font-size: 12px; color: #166534; font-style: italic; margin-top: 4px; }
    .payment-box { background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; font-size: 13px; margin-top: 16px; }
    .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${COMPANY_INFO.name}</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">THÔNG BÁO PHÁT HÀNH HOÁ ĐƠN ĐIỆN TỬ</p>
    </div>
    <div class="content">
      <p class="greeting">Kính gửi Quý khách hàng <strong>${invoice.customerName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Chúng tôi trân trọng gửi tới Quý khách thông tin hoá đơn điện tử giá trị gia tăng được phát hành chi tiết như sau:
      </p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Mã số hoá đơn:</span>
          <span class="card-value" style="color: #1E40AF;">${invoice.invoiceNumber || 'BẢN NHÁP (DRAFT)'}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Ngày phát hành:</span>
          <span class="card-value">${issueDateStr}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Mã số thuế:</span>
          <span class="card-value">${invoice.customerTaxCode || 'N/A'}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Trạng thái:</span>
          <span class="card-value">${invoice.status}</span>
        </div>
      </div>

      <div class="total-banner">
        <div style="font-size: 13px; color: #166534; text-transform: uppercase;">Tổng tiền thanh toán</div>
        <div class="total-amount">${formattedTotal}</div>
        <div class="in-words">Bằng chữ: ${totalInWords}</div>
      </div>

      <div class="payment-box">
        <strong>Thông tin thanh toán chuyển khoản:</strong><br>
        • Ngân hàng & STK: ${COMPANY_INFO.bankInfo}<br>
        • Nội dung chuyển khoản: Thanh toan hoa don ${invoice.invoiceNumber || invoice.id}
      </div>

      <p style="font-size: 13px; color: #64748B; margin-top: 16px;">
        📎 File PDF hoá đơn điện tử có mã xác thực và chữ ký số đã được đính kèm trực tiếp trong email này.
      </p>
    </div>
    <div class="footer">
      Đây là email tự động từ hệ thống Hoá đơn điện tử ${COMPANY_INFO.name}.<br>
      Hotline hỗ trợ: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}
    </div>
  </div>
</body>
</html>
    `;

    // 4. Send Email with PDF Attachment
    const info = await this.transporter.sendMail({
      from: `"${COMPANY_INFO.name}" <${COMPANY_INFO.email}>`,
      to: recipient,
      subject: `[${COMPANY_INFO.name}] Hoá đơn điện tử số ${invoice.invoiceNumber || invoice.id}`,
      html: htmlContent,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    return {
      success: true,
      messageId: info.messageId || 'mock-message-id',
      recipient,
      previewUrl,
    };
  }
}
