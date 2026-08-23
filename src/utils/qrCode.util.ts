import QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
}

/**
 * Generates a PNG Buffer of a QR Code for embedding into PDF documents.
 */
export async function generateQrCodeBuffer(
  text: string,
  options: QrCodeOptions = { width: 100, margin: 1 }
): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: 'png',
    width: options.width || 100,
    margin: options.margin || 1,
    color: {
      dark: '#1E3A8A', // Deep Blue
      light: '#FFFFFF',
    },
  });
}

/**
 * Builds a verification and quick-pay payload for electronic invoice.
 */
export function buildInvoiceQrPayload(
  invoiceId: string,
  invoiceNumber: string | null | undefined,
  totalAmount: number | string,
  customerName: string
): string {
  return JSON.stringify({
    type: 'E-INVOICE-VERIFICATION',
    invoiceNumber: invoiceNumber || 'DRAFT',
    invoiceId,
    amount: totalAmount,
    customer: customerName,
    verifyUrl: `https://invoicetech.vn/verify/${invoiceId}`,
  });
}
