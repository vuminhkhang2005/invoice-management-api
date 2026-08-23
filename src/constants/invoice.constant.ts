export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  CANCELED = 'CANCELED',
  REPLACED = 'REPLACED',
}

export const COMPANY_INFO = {
  name: 'INVOICE TECH SOLUTION CORP',
  taxCode: '0109887766',
  address: 'Floor 12, Keangnam Landmark 72, Pham Hung, Nam Tu Liem, Hanoi, Vietnam',
  phone: '+84 (024) 3888 9999',
  email: 'billing@invoicetech.vn',
  website: 'https://invoicetech.vn',
  bankInfo: 'Techcombank - Account No: 19038888999999 (VND)',
};

export const DEFAULT_TAX_RATE = 10; // 10% VAT
