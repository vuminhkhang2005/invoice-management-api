export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Invoice Management API',
    version: '1.0.0',
    description:
      'Enterprise-grade RESTful API for Electronic Invoice Management with Lifecycle State Machine (DRAFT -> ISSUED -> CANCELED / REPLACED), PDFKit vector export, VietQR payments, and Financial Analytics.',
    contact: {
      name: 'Vu Minh Khang - Backend Engineering',
      email: 'billing@invoicetech.vn',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'System', description: 'System health check and diagnostic endpoints' },
    { name: 'Invoices', description: 'Core invoice lifecycle and CRUD operations' },
    { name: 'Analytics & Export', description: 'Financial dashboards and CSV export' },
    { name: 'Verification & Audit', description: 'Invoice authenticity and activity history' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API server health',
        responses: {
          '200': {
            description: 'Server is healthy and operational',
          },
        },
      },
    },
    '/api/invoices': {
      post: {
        tags: ['Invoices'],
        summary: 'Create a new draft invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'items'],
                properties: {
                  customerName: { type: 'string', example: 'Cong ty Co phan FPT' },
                  customerEmail: { type: 'string', example: 'billing@fpt.vn' },
                  customerAddress: { type: 'string', example: 'Duy Tan, Cau Giay, Hanoi' },
                  customerTaxCode: { type: 'string', example: '0101234567' },
                  taxRate: { type: 'number', example: 10 },
                  notes: { type: 'string', example: 'Cloud services contract 2026' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['description', 'quantity', 'unitPrice'],
                      properties: {
                        description: { type: 'string', example: 'Dedicated Server E5' },
                        quantity: { type: 'integer', example: 2 },
                        unitPrice: { type: 'number', example: 15000000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Draft invoice created successfully' },
          '400': { description: 'Validation error' },
        },
      },
      get: {
        tags: ['Invoices'],
        summary: 'List invoices with filtering and pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'ISSUED', 'CANCELED', 'REPLACED'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Paginated list of invoices' },
        },
      },
    },
    '/api/invoices/analytics/summary': {
      get: {
        tags: ['Analytics & Export'],
        summary: 'Get financial summary and KPIs',
        responses: {
          '200': { description: 'Financial summary and statistics' },
        },
      },
    },
    '/api/invoices/export/csv': {
      get: {
        tags: ['Analytics & Export'],
        summary: 'Export invoices as CSV file',
        responses: {
          '200': {
            description: 'CSV file download',
            content: { 'text/csv': {} },
          },
        },
      },
    },
    '/api/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get invoice details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice details with items and replacement history' },
          '404': { description: 'Invoice not found' },
        },
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update draft invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Draft invoice updated' },
          '400': { description: 'Cannot update non-draft invoice' },
        },
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Delete draft invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Draft invoice deleted' },
          '400': { description: 'Cannot delete non-draft invoice' },
        },
      },
    },
    '/api/invoices/{id}/issue': {
      post: {
        tags: ['Invoices'],
        summary: 'Officially issue invoice (DRAFT -> ISSUED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice issued with unique number' },
          '400': { description: 'Invoice already issued or not in draft state' },
        },
      },
    },
    '/api/invoices/{id}/cancel': {
      post: {
        tags: ['Invoices'],
        summary: 'Cancel issued invoice (ISSUED -> CANCELED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cancelReason'],
                properties: {
                  cancelReason: { type: 'string', example: 'Customer requested order cancellation' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Invoice canceled' },
          '400': { description: 'Invalid state or missing cancellation reason' },
        },
      },
    },
    '/api/invoices/{id}/replace': {
      post: {
        tags: ['Invoices'],
        summary: 'Replace invoice (ISSUED/CANCELED -> REPLACED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '201': { description: 'New replacement invoice created' },
          '400': { description: 'Cannot replace draft or already replaced invoice' },
        },
      },
    },
    '/api/invoices/{id}/pdf': {
      get: {
        tags: ['Invoices'],
        summary: 'Export and download vector PDF invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'PDF binary stream',
            content: { 'application/pdf': {} },
          },
        },
      },
    },
    '/api/invoices/{id}/history': {
      get: {
        tags: ['Verification & Audit'],
        summary: 'Get invoice audit history and event logs',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice activity trail' },
        },
      },
    },
    '/api/invoices/{id}/verify': {
      get: {
        tags: ['Verification & Audit'],
        summary: 'Verify authenticity and legal validity of invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Verification certificate and status' },
        },
      },
    },
  },
};
