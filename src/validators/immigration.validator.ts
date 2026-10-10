import { z } from 'zod';
import { Gender, MaritalStatus, CaseStatus, EmploymentStatus, QCOutcome, NoteType } from '@prisma/client';

export const createAssessmentSchema = z.object({
  // Section A: Personal & Identity
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.nativeEnum(Gender),
  nationality: z.string().default('Bangladeshi'),
  nidNumber: z.string().optional(),
  passportNumber: z.string().min(6, 'Valid passport number is required'),
  passportExpiry: z.string().transform((str) => new Date(str)),
  maritalStatus: z.nativeEnum(MaritalStatus),
  currentAddress: z.string().min(5, 'Current address is required'),

  // Section B: Immigration Goal
  destinationCountry: z.string().min(2, 'Destination country is required'),
  applicationType: z.string().min(2, 'Application type is required'),
  specificProgram: z.string().optional(),
  targetApplicationDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
  priorApplications: z.boolean().default(false),
  priorRefusals: z.boolean().default(false),
  refusalDetails: z.string().optional(),

  // Section C: Employment Profile
  employmentProfile: z.object({
    employmentStatus: z.nativeEnum(EmploymentStatus),
    currentEmployer: z.string().optional(),
    jobTitle: z.string().optional(),
    employmentSince: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    monthlyIncome: z.number().nonnegative().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    businessSince: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    annualRevenue: z.number().nonnegative().optional(),
    institution: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    expectedGraduation: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
  }),

  // Section D: Financial Profile
  financialProfile: z.object({
    currentBankBalance: z.number().nonnegative('Bank balance must be positive'),
    hasSponsor: z.boolean().default(false),
    sponsorRelationship: z.string().optional(),
    sponsorContribution: z.number().nonnegative().optional(),
    sourceOfFunds: z.string().min(3, 'Source of funds description is required'),
    unusualDeposits: z.boolean().default(false),
    unusualDepositDetails: z.string().optional(),
  }),

  // Section E: Travel History
  travelHistory: z
    .array(
      z.object({
        country: z.string().min(2),
        visitPurpose: z.string().min(2),
        visitDate: z.string().transform((str) => new Date(str)),
        hadRefusal: z.boolean().default(false),
        refusalCountry: z.string().optional(),
        refusalReason: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  // Section F: Home Country Ties
  homeCountryTies: z.object({
    applicationPurpose: z.string().min(5, 'Application purpose explanation is required'),
    familyInBangladesh: z.boolean().default(true),
    familyDetails: z.string().optional(),
    ownsProperty: z.boolean().default(false),
    propertyDetails: z.string().optional(),
    intentToReturn: z.string().min(5, 'Intent to return / diaspora ties explanation is required'),
  }),
});

export const updateCaseSchema = z.object({
  destinationCountry: z.string().min(2).optional(),
  applicationType: z.string().min(2).optional(),
  specificProgram: z.string().optional(),
  targetApplicationDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
  priorApplications: z.boolean().optional(),
  priorRefusals: z.boolean().optional(),
  refusalDetails: z.string().optional(),
  stage: z.string().optional(),
});

export const updateCaseStatusSchema = z.object({
  status: z.nativeEnum(CaseStatus),
  stage: z.string().optional(),
  notes: z.string().optional(),
});

export const assignCoordinatorSchema = z.object({
  coordinatorId: z.string().uuid('Valid coordinator ID is required'),
});

export const createQCReviewSchema = z.object({
  reviewStage: z.string().min(2, 'Review stage is required'),
  outcome: z.nativeEnum(QCOutcome),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

export const createCaseNoteSchema = z.object({
  note: z.string().min(2, 'Note text cannot be empty'),
  noteType: z.nativeEnum(NoteType).optional().default(NoteType.GENERAL),
});
