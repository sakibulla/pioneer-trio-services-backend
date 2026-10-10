import { PrismaClient, UserRole, Gender, MaritalStatus, CaseStatus, EmploymentStatus, ProfileStatus, FamilyType, InterviewMode, MatchStatus, MatchResponse, NoteType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Pioneer Trio Services...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.declinedFile.deleteMany();
  await prisma.matchCheckIn.deleteMany();
  await prisma.matchProposal.deleteMany();
  await prisma.interviewRecord.deleteMany();
  await prisma.partnerPreference.deleteMany();
  await prisma.profilePhoto.deleteMany();
  await prisma.matrimonialProfile.deleteMany();
  await prisma.matchmaker.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.qCReview.deleteMany();
  await prisma.caseDocument.deleteMany();
  await prisma.homeCountryTies.deleteMany();
  await prisma.travelHistory.deleteMany();
  await prisma.financialProfile.deleteMany();
  await prisma.employmentProfile.deleteMany();
  await prisma.immigrationCase.deleteMany();
  await prisma.client.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(12);
  const defaultPasswordHash = await bcrypt.hash('Pioneer2026!Secure', salt);

  // 2. Create Staff & Admin Users
  console.log('👤 Creating staff and admin users...');

  const adminUser = await prisma.user.create({
    data: {
      email: 'pioneertrioservices@gmail.com',
      passwordHash: await bcrypt.hash('Xk9@pL2$mN4*Qw7&Rt3!Yx5vZ8hBcD1', await bcrypt.genSalt(12)),
      role: UserRole.ADMIN,
      firstName: 'Sakib',
      lastName: 'Hasan',
      phone: '+8801700000001',
      active: true,
    },
  });

  const coordinator1 = await prisma.user.create({
    data: {
      email: 'tahmid.coordinator@pioneertrioservices.com',
      passwordHash: await bcrypt.hash('Hj6#Kp2@Lq8*Ms4&Nt9$Uv1!Wx3%Yz5', await bcrypt.genSalt(12)),
      role: UserRole.COORDINATOR,
      firstName: 'Tahmid',
      lastName: 'Rahman',
      phone: '+8801700000002',
      active: true,
    },
  });

  const coordinator2 = await prisma.user.create({
    data: {
      email: 'nusrat.coordinator@pioneertrioservices.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.COORDINATOR,
      firstName: 'Nusrat',
      lastName: 'Jahan',
      phone: '+8801700000003',
      active: true,
    },
  });

  const matchmakerUser1 = await prisma.user.create({
    data: {
      email: 'farhana.matchmaker@pioneertrioservices.com',
      passwordHash: await bcrypt.hash('Sf7&Tg4#Uh9*Vi2@Wj5$Xk8%Yl1!Zm3', await bcrypt.genSalt(12)),
      role: UserRole.MATCHMAKER,
      firstName: 'Farhana',
      lastName: 'Chowdhury',
      phone: '+8801700000004',
      active: true,
    },
  });

  const matchmakerUser2 = await prisma.user.create({
    data: {
      email: 'arif.matchmaker@pioneertrioservices.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.MATCHMAKER,
      firstName: 'Arif',
      lastName: 'Mahmud',
      phone: '+8801700000005',
      active: true,
    },
  });

  const matchmaker1 = await prisma.matchmaker.create({
    data: {
      userId: matchmakerUser1.id,
      name: 'Farhana Chowdhury',
      bio: 'Senior Matrimonial Consultant specializing in UK, North America, and Gulf diaspora introductions.',
    },
  });

  const matchmaker2 = await prisma.matchmaker.create({
    data: {
      userId: matchmakerUser2.id,
      name: 'Arif Mahmud',
      bio: 'Matchmaking specialist with focus on domestic professionals and cross-cultural compatibility.',
    },
  });

  // 3. Create Immigration Clients & Cases
  console.log('📄 Creating immigration clients and comprehensive cases...');

  const client1 = await prisma.client.create({
    data: {
      fullName: 'Rafiqul Islam',
      email: 'rafiqul.islam@example.com',
      phone: '+8801811111111',
      dateOfBirth: new Date('1994-06-15'),
      gender: Gender.MALE,
      nationality: 'Bangladeshi',
      nidNumber: '19941234567890',
      passportNumber: 'EA0987654',
      passportExpiry: new Date('2031-08-20'),
      maritalStatus: MaritalStatus.SINGLE,
      currentAddress: 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh',
    },
  });

  const case1 = await prisma.immigrationCase.create({
    data: {
      clientId: client1.id,
      coordinatorId: coordinator1.id,
      caseReference: 'PTS-IMM-2026-0001',
      destinationCountry: 'Canada',
      applicationType: 'Express Entry - Federal Skilled Worker',
      specificProgram: 'FSW - Tech Stream',
      targetApplicationDate: new Date('2026-11-30'),
      priorApplications: false,
      priorRefusals: false,
      status: CaseStatus.UNDER_REVIEW,
      stage: 'Document Verification',
      submittedAt: new Date(),
    },
  });

  await prisma.employmentProfile.create({
    data: {
      caseId: case1.id,
      employmentStatus: EmploymentStatus.EMPLOYED,
      currentEmployer: 'Brain Station 23',
      jobTitle: 'Senior Software Engineer',
      employmentSince: new Date('2020-03-01'),
      monthlyIncome: 185000.0,
    },
  });

  await prisma.financialProfile.create({
    data: {
      caseId: case1.id,
      currentBankBalance: 1850000.0,
      hasSponsor: false,
      sourceOfFunds: 'Personal employment savings and gratuity fund',
      unusualDeposits: false,
    },
  });

  await prisma.travelHistory.createMany({
    data: [
      {
        caseId: case1.id,
        country: 'Malaysia',
        visitPurpose: 'Tourism and tech conference',
        visitDate: new Date('2023-05-10'),
        hadRefusal: false,
      },
      {
        caseId: case1.id,
        country: 'Thailand',
        visitPurpose: 'Vacation',
        visitDate: new Date('2024-01-15'),
        hadRefusal: false,
      },
    ],
  });

  await prisma.homeCountryTies.create({
    data: {
      caseId: case1.id,
      applicationPurpose: 'Permanent economic settlement in Canada through Express Entry.',
      familyInBangladesh: true,
      familyDetails: 'Parents residing in Dhaka; two younger sisters currently enrolled in university.',
      ownsProperty: true,
      propertyDetails: 'Shared ownership of family residential plot in Uttara Sector 10.',
      intentToReturn: 'Committed to ongoing family financial support and maintaining real estate ties in Dhaka.',
    },
  });

  await prisma.caseDocument.createMany({
    data: [
      {
        caseId: case1.id,
        documentType: 'PASSPORT_SCAN',
        fileName: 'rafiqul_passport_scan.pdf',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        storageKey: 'immigration/2026/0001/passport.enc',
        encrypted: true,
        verified: true,
        verifiedBy: coordinator1.id,
        verifiedAt: new Date(),
      },
      {
        caseId: case1.id,
        documentType: 'IELTS_CERTIFICATE',
        fileName: 'ielts_academic_trf.pdf',
        fileSize: 1820000,
        mimeType: 'application/pdf',
        storageKey: 'immigration/2026/0001/ielts.enc',
        encrypted: true,
        verified: true,
        verifiedBy: coordinator1.id,
        verifiedAt: new Date(),
      },
    ],
  });

  await prisma.caseNote.create({
    data: {
      caseId: case1.id,
      authorId: coordinator1.id,
      note: 'All identity documents verified. ECA report matches WES database. Ready for secondary QC review before final submission.',
      noteType: NoteType.INTERNAL,
    },
  });

  // 4. Create Matrimonial Profiles & Matches
  console.log('💍 Creating matrimonial profiles, photos, and match proposals...');

  const profileA = await prisma.matrimonialProfile.create({
    data: {
      fullName: 'Dr. Tanvir Ahmed',
      dateOfBirth: new Date('1992-04-10'),
      gender: Gender.MALE,
      height: 178,
      bloodGroup: 'B+',
      maritalStatus: MaritalStatus.SINGLE,
      currentNationality: 'Bangladeshi',
      currentCountry: 'United Kingdom',
      currentCity: 'London',
      visaStatus: 'Skilled Worker Visa (Tier 2 / NHS)',
      motherTongue: 'Bengali',
      languagesSpoken: ['Bengali', 'English', 'Urdu'],
      fatherOccupation: 'Retired Government Official (Joint Secretary)',
      motherOccupation: 'Professor of Economics, Dhaka University',
      siblingsCount: 1,
      siblingsMarried: 0,
      familyType: FamilyType.NUCLEAR,
      familyLocation: 'Dhanmondi, Dhaka & Central London',
      familyDescription: 'Respectable, educated Sunni Muslim family with strong academic background.',
      educationLevel: 'MBBS (Dhaka Medical College), MRCP (UK)',
      institution: 'Royal College of Physicians, London',
      fieldOfStudy: 'Internal Medicine / Cardiology Specialist Registrar',
      currentProfession: 'Doctor / Physician',
      jobTitle: 'Specialist Registrar (Cardiology)',
      employer: 'NHS Trust London',
      incomeBracket: '£75,000 - £90,000 / year',
      religion: 'Islam',
      sect: 'Sunni',
      religiousPractice: 'Practicing, observes 5 daily prayers, Halal lifestyle',
      ethnicity: 'Bengali',
      dietaryPreference: 'Halal Only',
      smokingHabits: 'Non-Smoker',
      drinkingHabits: 'Never',
      hobbies: 'Reading, chess, squash, charity medical clinics',
      status: ProfileStatus.ACTIVE,
      email: 'dr.tanvir.ahmed@example.com',
      phone: '+447700900123',
      preferredContactMethod: 'WhatsApp',
      approvedAt: new Date(),
    },
  });

  await prisma.profilePhoto.createMany({
    data: [
      {
        profileId: profileA.id,
        fileName: 'tanvir_portrait.webp',
        fileSize: 185000,
        mimeType: 'image/webp',
        storageKey: 'photos/tanvir_photo_1.webp',
        displayOrder: 1,
        verified: true,
      },
      {
        profileId: profileA.id,
        fileName: 'tanvir_lifestyle.webp',
        fileSize: 210000,
        mimeType: 'image/webp',
        storageKey: 'photos/tanvir_photo_2.webp',
        displayOrder: 2,
        verified: true,
      },
    ],
  });

  await prisma.partnerPreference.create({
    data: {
      profileId: profileA.id,
      ageMin: 23,
      ageMax: 29,
      preferredLocations: ['United Kingdom', 'Bangladesh', 'Canada'],
      preferredEducation: 'Doctor, Engineer, Master degree holder, or Corporate Professional',
      preferredProfession: 'Medical, Engineering, Finance, Education',
      religiousPreference: 'Practicing Muslimah, family-oriented, modest values',
      dealbreakers: 'Smoking, non-halal lifestyle, dishonest background information',
    },
  });

  const profileB = await prisma.matrimonialProfile.create({
    data: {
      fullName: 'Nadia Rahman',
      dateOfBirth: new Date('1996-09-22'),
      gender: Gender.FEMALE,
      height: 165,
      bloodGroup: 'O+',
      maritalStatus: MaritalStatus.SINGLE,
      currentNationality: 'Bangladeshi',
      currentCountry: 'United Kingdom',
      currentCity: 'Manchester',
      visaStatus: 'Graduate Route / Skilled Worker',
      motherTongue: 'Bengali',
      languagesSpoken: ['Bengali', 'English'],
      fatherOccupation: 'Managing Director, Textiles Manufacturing',
      motherOccupation: 'Homemaker',
      siblingsCount: 2,
      siblingsMarried: 1,
      familyType: FamilyType.NUCLEAR,
      familyLocation: 'Gulshan 2, Dhaka & Manchester',
      familyDescription: 'Traditional, well-settled family with high moral values and established family business.',
      educationLevel: 'BSc Computer Science (IUB), MSc Data Science (University of Manchester)',
      institution: 'University of Manchester',
      fieldOfStudy: 'Data Science & Machine Learning',
      currentProfession: 'Data Scientist',
      jobTitle: 'Senior Analytics Engineer',
      employer: 'Barclays UK',
      incomeBracket: '£55,000 - £70,000 / year',
      religion: 'Islam',
      sect: 'Sunni',
      religiousPractice: 'Practicing, family-oriented, observes hijab/modesty',
      ethnicity: 'Bengali',
      dietaryPreference: 'Halal Only',
      smokingHabits: 'Non-Smoker',
      drinkingHabits: 'Never',
      hobbies: 'Baking, painting, photography, travel',
      status: ProfileStatus.ACTIVE,
      email: 'nadia.rahman@example.com',
      phone: '+447700900456',
      preferredContactMethod: 'Email & WhatsApp',
      approvedAt: new Date(),
    },
  });

  await prisma.profilePhoto.createMany({
    data: [
      {
        profileId: profileB.id,
        fileName: 'nadia_portrait.webp',
        fileSize: 192000,
        mimeType: 'image/webp',
        storageKey: 'photos/nadia_photo_1.webp',
        displayOrder: 1,
        verified: true,
      },
      {
        profileId: profileB.id,
        fileName: 'nadia_formal.webp',
        fileSize: 178000,
        mimeType: 'image/webp',
        storageKey: 'photos/nadia_photo_2.webp',
        displayOrder: 2,
        verified: true,
      },
    ],
  });

  await prisma.partnerPreference.create({
    data: {
      profileId: profileB.id,
      ageMin: 28,
      ageMax: 35,
      preferredLocations: ['United Kingdom', 'London', 'Manchester'],
      preferredEducation: 'Physician, Engineer, PhD or Corporate Professional',
      religiousPreference: 'Practicing Muslim with integrity and good character',
      dealbreakers: 'Smoking, unsupportive of career goals, lack of family values',
    },
  });

  // 5. Matchmaker In-Person / Video Interview Logs
  await prisma.interviewRecord.create({
    data: {
      profileId: profileA.id,
      matchmakerId: matchmaker1.id,
      interviewDate: new Date('2026-08-15'),
      mode: InterviewMode.VIDEO_CALL,
      intentAssessment: 'Clear, authentic commitment to marriage within the next 6-12 months. High emotional maturity.',
      redFlagNotes: 'None detected. Verified GMC registration and NHS employment credentials directly.',
      internalProfilingTags: ['High Earner', 'Medical Professional', 'UK Based', 'Family-Focused'],
      compatibilityNotes: 'Prefers an educated partner who values both career advancement and cultural/religious foundations.',
      communicationStyle: 'Polite, articulate, humble.',
      familyExpectations: 'Both parents supportive; looking for mutual respect between families.',
      recommendApproval: true,
    },
  });

  // 6. Human-Led Match Proposal
  const matchProposal = await prisma.matchProposal.create({
    data: {
      profileIdA: profileA.id,
      profileIdB: profileB.id,
      proposedBy: matchmaker1.id,
      rationale: 'Complementary UK residency status (London & Manchester), strong educational synergy (Cardiology Registrar + Senior Data Scientist), aligned Sunni Islamic values, and closely matched family backgrounds in Dhaka.',
      status: MatchStatus.BOTH_INTERESTED,
      responseA: MatchResponse.INTERESTED,
      responseAAt: new Date(),
      responseB: MatchResponse.INTERESTED,
      responseBAt: new Date(),
    },
  });

  await prisma.matchCheckIn.create({
    data: {
      matchId: matchProposal.id,
      checkInDate: new Date(),
      notes: 'Both parties expressed mutual interest after reading curated profile summaries. Coordinating supervised virtual introduction call.',
      outcome: 'Virtual meeting scheduled for next weekend.',
    },
  });

  // 7. General Contact & Newsletter
  await prisma.contactInquiry.create({
    data: {
      name: 'Mahbub Alom',
      email: 'mahbub.alom@example.com',
      phone: '+8801712345678',
      serviceLine: 'immigration',
      subject: 'Inquiry on Australian Skilled Independent (Subclass 189)',
      message: 'Hello, I have 8 years of experience in civil engineering in Dhaka and would like an initial assessment for Australian migration.',
      status: 'NEW',
    },
  });

  await prisma.newsletterSubscriber.create({
    data: {
      email: 'subscriber@example.com',
      isVerified: true,
    },
  });

  console.log('✅ Seed completed successfully! All entities created with relational integrity.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
