import { z } from 'zod';
import {
  Gender,
  MaritalStatus,
  FamilyType,
  ProfileStatus,
  InterviewMode,
  MatchStatus,
  MatchResponse,
  DeclineReason,
} from '@prisma/client';

export const createMatrimonialProfileSchema = z.object({
  // Section A: Personal & Identity
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.nativeEnum(Gender),
  height: z.number().int().positive().optional(),
  bloodGroup: z.string().optional(),
  maritalStatus: z.nativeEnum(MaritalStatus),
  currentNationality: z.string().default('Bangladeshi'),
  currentCountry: z.string().min(1, 'Current country is required'),
  currentCity: z.string().min(1, 'Current city is required'),
  visaStatus: z.string().optional(),
  motherTongue: z.string().default('Bengali'),
  languagesSpoken: z.array(z.string()).min(1, 'At least one language is required'),

  // Section B: Family Background
  fatherOccupation: z.string().min(1, 'Father occupation is required'),
  motherOccupation: z.string().min(1, 'Mother occupation is required'),
  siblingsCount: z.number().int().nonnegative().default(0),
  siblingsMarried: z.number().int().nonnegative().default(0),
  familyType: z.nativeEnum(FamilyType).default(FamilyType.NUCLEAR),
  familyLocation: z.string().min(1, 'Family location is required'),
  familyDescription: z.string().optional(),

  // Section C: Education & Profession
  educationLevel: z.string().min(1, 'Education level is required'),
  institution: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  currentProfession: z.string().min(1, 'Current profession is required'),
  jobTitle: z.string().optional(),
  employer: z.string().optional(),
  incomeBracket: z.string().optional(),

  // Section D: Religious & Cultural
  religion: z.string().default('Islam'),
  sect: z.string().optional(),
  religiousPractice: z.string().min(1, 'Religious practice is required'),
  ethnicity: z.string().default('Bengali'),

  // Section E: Lifestyle
  dietaryPreference: z.string().min(1, 'Dietary preference is required'),
  smokingHabits: z.string().min(1, 'Smoking habits is required'),
  drinkingHabits: z.string().min(1, 'Drinking habits is required'),
  hobbies: z.string().optional(),

  // Contact
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(5, 'Phone number is required'),
  preferredContactMethod: z.string().default('Email'),

  // Section F: Partner Preferences
  partnerPreference: z.object({
    ageMin: z.number().int().min(18),
    ageMax: z.number().int().max(100),
    preferredLocations: z.array(z.string()).min(1),
    preferredEducation: z.string().optional(),
    preferredProfession: z.string().optional(),
    religiousPreference: z.string().optional(),
    otherPreferences: z.string().optional(),
    dealbreakers: z.string().optional(),
  }),
});

export const updateMatrimonialProfileSchema = createMatrimonialProfileSchema.partial();

export const updateProfileStatusSchema = z.object({
  status: z.nativeEnum(ProfileStatus),
  rejectionReason: z.string().optional(),
});

export const createInterviewRecordSchema = z.object({
  interviewDate: z.string().transform((str) => new Date(str)),
  mode: z.nativeEnum(InterviewMode),
  intentAssessment: z.string().min(5, 'Intent assessment is required'),
  redFlagNotes: z.string().optional(),
  internalProfilingTags: z.array(z.string()).default([]),
  compatibilityNotes: z.string().optional(),
  communicationStyle: z.string().optional(),
  familyExpectations: z.string().optional(),
  recommendApproval: z.boolean().default(false),
});

export const createMatchProposalSchema = z.object({
  profileIdA: z.string().uuid('Profile ID A must be a valid UUID'),
  profileIdB: z.string().uuid('Profile ID B must be a valid UUID'),
  rationale: z.string().min(20, 'Human rationale must be detailed (min 20 characters)'),
});

export const respondMatchSchema = z.object({
  response: z.nativeEnum(MatchResponse),
});

export const createMatchCheckInSchema = z.object({
  checkInDate: z.string().optional().transform((str) => (str ? new Date(str) : new Date())),
  notes: z.string().min(5, 'Check-in notes are required'),
  outcome: z.string().optional(),
  nextFollowUp: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});

export const declineProfileSchema = z.object({
  reasonCategory: z.nativeEnum(DeclineReason),
  notes: z.string().min(10, 'Detailed notes explaining decline reason are mandatory'),
});
