export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Invoice Management API - Grand Enterprise Edition',
    version: '1.0.0',
    description:
      'Enterprise-grade Electronic Invoice RESTful API featuring Lifecycle State Machine (DRAFT -> ISSUED -> CANCELED / REPLACED), PDFKit vector generator with VietQR & Vietnamese words reading, Automated Email Dispatch, Batch ZIP export, JWT RBAC, and Financial Analytics.',
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
    { name: 'Authentication & Roles', description: 'JWT authentication, demo tokens, and user profile' },
    { name: 'Invoices', description: 'Core invoice lifecycle, CRUD, and state transitions' },
    { name: 'Batch & Export', description: 'Batch operations, CSV table export, and ZIP bundle download' },
    { name: 'Email Dispatch', description: 'Automated email notifications with vector PDF attachments' },
    { name: 'Analytics & KPIs', description: 'Financial dashboards and customer statistics' },
    { name: 'Verification & Audit', description: 'Invoice authenticity certificates and activity history' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT Bearer Token (obtain via /api/auth/demo-accounts or /api/auth/login)',
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API server health',
        responses: { '200': { description: 'Server is healthy and operational' } },
      },
    },
    '/api/auth/demo-accounts': {
      get: {
        tags: ['Authentication & Roles'],
        summary: 'Get pre-signed demo JWT tokens for all 4 roles (Admin, Chief Accountant, Accountant, Auditor)',
        responses: { '200': { description: 'List of demo credentials with ready-to-use Bearer tokens' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication & Roles'],
        summary: 'Issue JWT Token for specified role/email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'role'],
                properties: {
                  email: { type: 'string', example: 'accountant@invoicetech.vn' },
                  name: { type: 'string', example: 'Nguyen Van Ke Toan' },
                  role: { type: 'string', enum: ['ADMIN', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'AUDITOR'], example: 'ACCOUNTANT' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'JWT token issued successfully' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication & Roles'],
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'User profile' } },
      },
    },
    '/api/invoices': {
      post: {
        tags: ['Invoices'],
        summary: 'Create a new draft invoice',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'items'],
                properties: {
                  customerName: { type: 'string', example: 'Cong ty TNHH Cong Nghe Tuong Lai' },
                  customerEmail: { type: 'string', example: 'billing@tuonglai.tech' },
                  customerAddress: { type: 'string', example: 'Landmark 72, Hanoi' },
                  customerTaxCode: { type: 'string', example: '0109988776' },
                  taxRate: { type: 'number', example: 10 },
                  notes: { type: 'string', example: 'Cloud services contract 2026' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['description', 'quantity', 'unitPrice'],
                      properties: {
                        description: { type: 'string', example: 'Cloud Infrastructure Setup' },
                        quantity: { type: 'integer', example: 1 },
                        unitPrice: { type: 'number', example: 25000000 },
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
        responses: { '200': { description: 'Paginated list of invoices' } },
      },
    },
    '/api/invoices/analytics/summary': {
      get: {
        tags: ['Analytics & KPIs'],
        summary: 'Get financial summary, revenue KPIs, and top customers',
        responses: { '200': { description: 'Financial summary and statistics' } },
      },
    },
    '/api/invoices/export/csv': {
      get: {
        tags: ['Batch & Export'],
        summary: 'Export invoice registry as UTF-8 BOM CSV for Excel',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'ISSUED', 'CANCELED', 'REPLACED'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'CSV file download',
            content: { 'text/csv': {} },
          },
        },
      },
    },
    '/api/invoices/export/zip': {
      post: {
        tags: ['Batch & Export'],
        summary: 'Export multiple invoice PDFs bundled into a single ZIP archive',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  invoiceIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['0d07e960-776e-4c15-8eaf-de4e49256bda'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'ZIP archive binary stream',
            content: { 'application/zip': {} },
          },
        },
      },
    },
    '/api/invoices/batch/issue': {
      post: {
        tags: ['Batch & Export'],
        summary: 'Batch issue multiple draft invoices in an atomic transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['invoiceIds'],
                properties: {
                  invoiceIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['draft-id-1', 'draft-id-2'],
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'All requested invoices issued successfully' } },
      },
    },
    '/api/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get invoice details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice details with items, Vietnamese words, and replacement history' },
          '404': { description: 'Invoice not found' },
        },
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update draft invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Draft invoice updated' } },
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Delete draft invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Draft invoice deleted' } },
      },
    },
    '/api/invoices/{id}/issue': {
      post: {
        tags: ['Invoices'],
        summary: 'Officially issue invoice (DRAFT -> ISSUED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Invoice issued with unique number' } },
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
        responses: { '200': { description: 'Invoice canceled' } },
      },
    },
    '/api/invoices/{id}/replace': {
      post: {
        tags: ['Invoices'],
        summary: 'Replace invoice (ISSUED/CANCELED -> REPLACED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'New replacement invoice created' } },
      },
    },
    '/api/invoices/{id}/pdf': {
      get: {
        tags: ['Invoices'],
        summary: 'Export and download vector PDF invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'PDF binary stream with VietQR and in-words amount',
            content: { 'application/pdf': {} },
          },
        },
      },
    },
    '/api/invoices/{id}/send-email': {
      post: {
        tags: ['Email Dispatch'],
        summary: 'Send invoice PDF via email to customer with responsive HTML template',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  recipientEmail: { type: 'string', example: 'client@company.vn' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Email dispatched successfully with attachment' } },
      },
    },
    '/api/invoices/{id}/history': {
      get: {
        tags: ['Verification & Audit'],
        summary: 'Get invoice audit history and event logs',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Invoice activity trail' } },
      },
    },
    '/api/invoices/{id}/verify': {
      get: {
        tags: ['Verification & Audit'],
        summary: 'Verify authenticity and legal validity of invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Verification certificate and digital signature' } },
      },
    },
  },
};
