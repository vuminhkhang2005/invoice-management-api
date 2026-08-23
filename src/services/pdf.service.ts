import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import { COMPANY_INFO, InvoiceStatus } from '../constants/invoice.constant';
import { formatCurrencyVND } from '../utils/calculation.util';

export interface InvoicePdfData {
  id: string;
  invoiceNumber?: string | null;
  status: string;
  customerName: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerTaxCode?: string | null;
  taxRate: any;
  subtotal: any;
  taxAmount: any;
  totalAmount: any;
  notes?: string | null;
  cancelReason?: string | null;
  issuedAt?: Date | string | null;
  canceledAt?: Date | string | null;
  replacedInvoiceId?: string | null;
  replacedInvoice?: {
    id: string;
    invoiceNumber?: string | null;
    issuedAt?: Date | string | null;
    totalAmount?: any;
  } | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: any;
    amount: any;
  }>;
}

export class PdfService {
  /**
   * Generates a PDF invoice and pipes it into a writable stream (e.g. Express Response)
   */
  generateInvoicePdfStream(invoice: InvoicePdfData, outputStream: Writable): void {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
        Author: COMPANY_INFO.name,
        Subject: 'VAT Electronic Invoice',
      },
    });

    doc.pipe(outputStream);

    this.renderHeader(doc, invoice);
    this.renderCustomerAndInvoiceInfo(doc, invoice);
    this.renderItemsTable(doc, invoice);
    this.renderTotals(doc, invoice);
    this.renderFooterAndNotes(doc, invoice);

    if (invoice.status === InvoiceStatus.CANCELED || invoice.status === InvoiceStatus.DRAFT) {
      this.renderWatermark(doc, invoice.status);
    }

    doc.end();
  }

  /**
   * Generates a PDF invoice and returns it as a Buffer (useful for testing and email attachments)
   */
  async generateInvoicePdfBuffer(invoice: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      this.renderHeader(doc, invoice);
      this.renderCustomerAndInvoiceInfo(doc, invoice);
      this.renderItemsTable(doc, invoice);
      this.renderTotals(doc, invoice);
      this.renderFooterAndNotes(doc, invoice);

      if (invoice.status === InvoiceStatus.CANCELED || invoice.status === InvoiceStatus.DRAFT) {
        this.renderWatermark(doc, invoice.status);
      }

      doc.end();
    });
  }

  private renderHeader(doc: PDFKit.PDFDocument, invoice: InvoicePdfData): void {
    // Top colored banner
    doc.rect(40, 40, 515, 6).fill('#1E40AF');

    // Company Information (Left side)
    doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(COMPANY_INFO.name, 40, 55);
    doc.fontSize(8.5).font('Helvetica').fillColor('#64748B');
    doc.text(`Tax Code: ${COMPANY_INFO.taxCode}`, 40, 74);
    doc.text(`Address: ${COMPANY_INFO.address}`, 40, 86, { width: 300 });
    doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 40, 108);

    // Title and Status (Right side)
    doc.fillColor('#1E40AF').fontSize(16).font('Helvetica-Bold').text('VAT INVOICE', 370, 55, { align: 'right', width: 185 });
    doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('HOA DON GIA TRI GIA TANG', 370, 74, { align: 'right', width: 185 });

    // Status Badge Box
    const badgeColor = this.getStatusColor(invoice.status);
    doc.roundedRect(440, 92, 115, 22, 3).fillAndStroke(badgeColor.bg, badgeColor.border);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(badgeColor.text).text(invoice.status, 440, 98, { align: 'center', width: 115 });

    // Divider
    doc.moveTo(40, 130).lineTo(555, 130).strokeColor('#E2E8F0').lineWidth(1).stroke();
  }

  private renderCustomerAndInvoiceInfo(doc: PDFKit.PDFDocument, invoice: InvoicePdfData): void {
    const topY = 140;

    // Customer Box (Left)
    doc.rect(40, topY, 250, 85).fillAndStroke('#F8FAFC', '#E2E8F0');
    doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text('BUYER / KHACH HANG', 50, topY + 8);
    
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text('Name:', 50, topY + 24);
    doc.font('Helvetica').fillColor('#0F172A').text(invoice.customerName || 'N/A', 90, topY + 24, { width: 190 });

    doc.font('Helvetica-Bold').fillColor('#475569').text('Tax Code:', 50, topY + 38);
    doc.font('Helvetica').fillColor('#0F172A').text(invoice.customerTaxCode || 'N/A', 100, topY + 38);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Email:', 50, topY + 52);
    doc.font('Helvetica').fillColor('#0F172A').text(invoice.customerEmail || 'N/A', 90, topY + 52);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Address:', 50, topY + 66);
    doc.font('Helvetica').fillColor('#0F172A').text(invoice.customerAddress || 'N/A', 95, topY + 66, { width: 185, height: 20 });

    // Invoice Meta Box (Right)
    doc.rect(305, topY, 250, 85).fillAndStroke('#F8FAFC', '#E2E8F0');
    doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text('INVOICE DETAILS', 315, topY + 8);

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text('Invoice No:', 315, topY + 24);
    doc.font('Helvetica-Bold').fillColor('#1E40AF').text(invoice.invoiceNumber || 'NOT YET ISSUED (DRAFT)', 375, topY + 24);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Issue Date:', 315, topY + 38);
    const dateStr = invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('vi-VN') : 'N/A';
    doc.font('Helvetica').fillColor('#0F172A').text(dateStr, 375, topY + 38);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Currency:', 315, topY + 52);
    doc.font('Helvetica').fillColor('#0F172A').text('VND', 375, topY + 52);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Payment Method:', 315, topY + 66);
    doc.font('Helvetica').fillColor('#0F172A').text('Bank Transfer / TM', 400, topY + 66);
  }

  private renderItemsTable(doc: PDFKit.PDFDocument, invoice: InvoicePdfData): void {
    const tableTop = 238;

    // Header Bar
    doc.rect(40, tableTop, 515, 22).fill('#2563EB');
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('#', 45, tableTop + 6, { width: 25, align: 'center' });
    doc.text('Item Description / Ten hang hoa, dich vu', 75, tableTop + 6, { width: 220 });
    doc.text('Qty', 300, tableTop + 6, { width: 40, align: 'right' });
    doc.text('Unit Price (VND)', 345, tableTop + 6, { width: 95, align: 'right' });
    doc.text('Amount (VND)', 445, tableTop + 6, { width: 100, align: 'right' });

    let currentY = tableTop + 22;

    invoice.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.rect(40, currentY, 515, 20).fill('#F1F5F9');
      }

      doc.fontSize(8.5).font('Helvetica').fillColor('#1E293B');
      doc.text(String(index + 1), 45, currentY + 5, { width: 25, align: 'center' });
      doc.text(item.description, 75, currentY + 5, { width: 220 });
      doc.text(String(item.quantity), 300, currentY + 5, { width: 40, align: 'right' });
      doc.text(formatCurrencyVND(item.unitPrice), 345, currentY + 5, { width: 95, align: 'right' });
      doc.text(formatCurrencyVND(item.amount), 445, currentY + 5, { width: 100, align: 'right' });

      currentY += 20;
    });

    // Table bottom line
    doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#CBD5E1').lineWidth(1).stroke();
  }

  private renderTotals(doc: PDFKit.PDFDocument, invoice: InvoicePdfData): void {
    const startY = 240 + Math.max(invoice.items.length * 20, 40) + 15;

    // Totals Box (Right aligned)
    const boxX = 300;
    const boxWidth = 255;

    doc.rect(boxX, startY, boxWidth, 80).fillAndStroke('#F8FAFC', '#E2E8F0');

    // Subtotal
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text('Subtotal (Tien hang):', boxX + 10, startY + 8);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatCurrencyVND(invoice.subtotal), boxX + 10, startY + 8, {
      align: 'right',
      width: boxWidth - 20,
    });

    // VAT
    doc.font('Helvetica-Bold').fillColor('#475569').text(`VAT Rate (${invoice.taxRate}%):`, boxX + 10, startY + 24);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatCurrencyVND(invoice.taxAmount), boxX + 10, startY + 24, {
      align: 'right',
      width: boxWidth - 20,
    });

    // Grand Total Banner
    doc.rect(boxX, startY + 44, boxWidth, 36).fill('#1E40AF');
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#FFFFFF').text('GRAND TOTAL (TONG CONG):', boxX + 10, startY + 56);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF').text(formatCurrencyVND(invoice.totalAmount), boxX + 10, startY + 55, {
      align: 'right',
      width: boxWidth - 20,
    });
  }

  private renderFooterAndNotes(doc: PDFKit.PDFDocument, invoice: InvoicePdfData): void {
    const footerY = 480;

    // Replacement or notes alert
    if (invoice.replacedInvoice) {
      doc.rect(40, footerY - 45, 515, 26).fillAndStroke('#FEF3C7', '#F59E0B');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#92400E').text(
        `* LUU Y: Hoa don nay thay the cho hoa don so [${invoice.replacedInvoice.invoiceNumber || invoice.replacedInvoice.id}]`,
        50,
        footerY - 37
      );
    }

    if (invoice.notes) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('Notes / Ghi chu:', 40, footerY - 15);
      doc.font('Helvetica').fillColor('#64748B').text(invoice.notes, 110, footerY - 15, { width: 440 });
    }

    // Signatures
    const sigY = footerY + 25;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B');
    doc.text('NGUOI MUA HANG (Buyer)', 70, sigY, { align: 'center', width: 160 });
    doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text('(Ky, ghi ro ho ten)', 70, sigY + 12, { align: 'center', width: 160 });

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B');
    doc.text('NGUOI BAN HANG (Seller)', 360, sigY, { align: 'center', width: 160 });
    doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text('(Ky dien tu, dong dau)', 360, sigY + 12, { align: 'center', width: 160 });

    // Payment info at bottom
    doc.rect(40, 750, 515, 30).fill('#F1F5F9');
    doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(
      `Payment terms: Transfer within 15 days to ${COMPANY_INFO.bankInfo}`,
      45,
      760,
      { align: 'center', width: 505 }
    );
  }

  private renderWatermark(doc: PDFKit.PDFDocument, status: string): void {
    doc.save();
    doc.opacity(0.12);
    doc.rotate(-35, { origin: [297, 420] });
    
    if (status === InvoiceStatus.CANCELED) {
      doc.fontSize(60).font('Helvetica-Bold').fillColor('#DC2626').text('CANCELED - DA HUY', 60, 400, { align: 'center' });
    } else if (status === InvoiceStatus.DRAFT) {
      doc.fontSize(55).font('Helvetica-Bold').fillColor('#64748B').text('DRAFT - BAN NHAP', 70, 400, { align: 'center' });
    }

    doc.restore();
  }

  private getStatusColor(status: string): { bg: string; border: string; text: string } {
    switch (status) {
      case InvoiceStatus.ISSUED:
        return { bg: '#DCFCE7', border: '#16A34A', text: '#15803D' };
      case InvoiceStatus.CANCELED:
        return { bg: '#FEE2E2', border: '#DC2626', text: '#B91C1C' };
      case InvoiceStatus.REPLACED:
        return { bg: '#FEF3C7', border: '#D97706', text: '#B45309' };
      case InvoiceStatus.DRAFT:
      default:
        return { bg: '#F1F5F9', border: '#94A3B8', text: '#475569' };
    }
  }
}
