export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ROLES = {
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINATOR',
  MATCHMAKER: 'MATCHMAKER',
  CLIENT: 'CLIENT',
} as const;

export const CASE_STATUSES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  DOCUMENTS_PENDING: 'DOCUMENTS_PENDING',
  QC_REVIEW: 'QC_REVIEW',
  APPROVED: 'APPROVED',
  REFERRED: 'REFERRED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
} as const;

export const PROFILE_STATUSES = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  MATCHED: 'MATCHED',
  DECLINED: 'DECLINED',
  INACTIVE: 'INACTIVE',
} as const;

export const MATCH_STATUSES = {
  PROPOSED: 'PROPOSED',
  BOTH_INTERESTED: 'BOTH_INTERESTED',
  INTRODUCED: 'INTRODUCED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUCCESSFUL: 'SUCCESSFUL',
  DECLINED: 'DECLINED',
  CLOSED: 'CLOSED',
} as const;

export const CACHE_KEYS = {
  DASHBOARD_STATS: 'cache:admin:dashboard_stats',
  COORDINATOR_STATS: (id: string) => `cache:coordinator:${id}:stats`,
  MATCHMAKER_STATS: (id: string) => `cache:matchmaker:${id}:stats`,
  PROFILE_SEARCH: (hash: string) => `cache:profiles:search:${hash}`,
  REFRESH_TOKEN: (userId: string, jti: string) => `auth:refresh:${userId}:${jti}`,
  USER_SESSION: (userId: string) => `auth:session:${userId}`,
  LOGIN_ATTEMPTS: (email: string) => `auth:attempts:${email}`,
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  SESSION: 7 * 24 * 60 * 60, // 7 days
} as const;

export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: ['application/pdf', 'image/jpeg', 'image/png'],
  PHOTOS: ['image/jpeg', 'image/png', 'image/webp'],
};

export const MAX_FILE_SIZES = {
  DOCUMENT: 15 * 1024 * 1024, // 15MB
  PHOTO: 8 * 1024 * 1024, // 8MB
};
