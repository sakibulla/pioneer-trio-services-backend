import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test-secret-key-for-jest-unit-and-integration-tests';
process.env.ENCRYPTION_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.LOG_LEVEL = 'error';

// Mock Bull queue if not running Redis in CI
jest.mock('../src/jobs/queue', () => ({
  emailQueue: { add: jest.fn().mockResolvedValue({ id: 'job-1' }), process: jest.fn(), on: jest.fn() },
  documentQueue: { add: jest.fn().mockResolvedValue({ id: 'job-2' }), process: jest.fn(), on: jest.fn() },
  cleanupQueue: { add: jest.fn().mockResolvedValue({ id: 'job-3' }), process: jest.fn(), on: jest.fn() },
}));

// Suppress console logs during testing
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
