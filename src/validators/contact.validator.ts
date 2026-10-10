import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const contactInquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  serviceLine: z.enum(['immigration', 'matrimonial', 'general']).default('general'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  bio: z.string().optional(), // For matchmakers
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
});
