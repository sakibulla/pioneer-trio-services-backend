import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Pioneer Trio Services API Documentation',
    version: '1.0.0',
    description: `
# Pioneer Trio Services - Production Backend API

High-performance, secure backend REST API server for **Pioneer Trio Services** (Immigration Consultancy & Marriage Consultancy).

## Core Capabilities
- **Immigration Case Management**: Multi-step structured assessment, dynamic document checklist, AES-256-GCM encrypted file storage, peer QC review state machine, and case notes.
- **Marriage Consultancy**: Verified profile intake, strict 2-photo maximum enforcement, Sharp WebP optimization, staff-only interview records, and human-led (zero algorithmic) match proposals.
- **Security & RBAC**: JWT access/refresh token rotation, bcrypt password hashing, 5-attempt lockout, role-based authorization (ADMIN, COORDINATOR, MATCHMAKER, CLIENT), and 4-eyes QC review separation.
- **Observability**: Structured Winston logging with sensitive data masking, Prometheus metrics (\`/metrics\`), Sentry error tracking, and Bull queue background job processing.
    `,
    contact: {
      name: 'Pioneer Trio Technical Operations',
      email: 'tech@pioneertrioservices.com',
      url: 'https://pioneertrioservices.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Local Development Server',
    },
    {
      url: `https://api.pioneertrioservices.com${env.API_PREFIX}`,
      description: 'Production API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token in the format: Bearer <token>',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description message' },
          errors: { type: 'array', items: { type: 'object' } },
          timestamp: { type: 'string', format: 'date-time' },
          correlationId: { type: 'string', example: 'a1b2c3d4-e5f6-7890' },
        },
      },
      UserRegistration: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email', example: 'client@example.com' },
          password: { type: 'string', format: 'password', example: 'Pioneer2026!Secure' },
          firstName: { type: 'string', example: 'Rafiqul' },
          lastName: { type: 'string', example: 'Islam' },
          phone: { type: 'string', example: '+8801811111111' },
          role: { type: 'string', enum: ['CLIENT', 'COORDINATOR', 'MATCHMAKER', 'ADMIN'], default: 'CLIENT' },
        },
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@pioneertrioservices.com' },
          password: { type: 'string', format: 'password', example: 'Pioneer2026!Secure' },
        },
      },
      ImmigrationAssessment: {
        type: 'object',
        required: ['fullName', 'email', 'phone', 'dateOfBirth', 'gender', 'passportNumber', 'passportExpiry', 'maritalStatus', 'currentAddress', 'destinationCountry', 'applicationType', 'employmentProfile', 'financialProfile', 'homeCountryTies'],
        properties: {
          fullName: { type: 'string', example: 'Rafiqul Islam' },
          email: { type: 'string', format: 'email', example: 'rafiqul@example.com' },
          phone: { type: 'string', example: '+8801811111111' },
          dateOfBirth: { type: 'string', format: 'date', example: '1994-06-15' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
          nationality: { type: 'string', example: 'Bangladeshi' },
          nidNumber: { type: 'string', example: '19941234567890' },
          passportNumber: { type: 'string', example: 'EA0987654' },
          passportExpiry: { type: 'string', format: 'date', example: '2031-08-20' },
          maritalStatus: { type: 'string', enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] },
          currentAddress: { type: 'string', example: 'House 42, Road 11, Banani, Dhaka' },
          destinationCountry: { type: 'string', example: 'Canada' },
          applicationType: { type: 'string', example: 'Express Entry - Federal Skilled Worker' },
          priorApplications: { type: 'boolean', example: false },
          priorRefusals: { type: 'boolean', example: false },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRegistration' } } },
        },
        responses: {
          201: { description: 'User successfully created' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserLogin' } } },
        },
        responses: {
          200: { description: 'JWT tokens generated' },
          401: { description: 'Invalid credentials or account locked' },
        },
      },
    },
    '/immigration/assessments': {
      post: {
        summary: 'Submit complete 8-section immigration assessment',
        tags: ['Immigration Consultancy'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ImmigrationAssessment' } } },
        },
        responses: {
          201: { description: 'Assessment received and coordinator assigned' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Liveness health check probe',
        tags: ['System & Health'],
        responses: {
          200: { description: 'API is running' },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Readiness check for Database, Redis, and S3 Storage',
        tags: ['System & Health'],
        responses: {
          200: { description: 'All infrastructure dependencies healthy' },
          503: { description: 'Infrastructure dependency unavailable' },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/api/v1/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
