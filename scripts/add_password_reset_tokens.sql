-- Migration: add_password_reset_tokens
-- Run this SQL against your PostgreSQL database to add the password reset tokens table.
-- This enables secure, database-backed password reset (token stored as SHA-256 hash).

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id"         TEXT         NOT NULL,
    "user_id"    TEXT         NOT NULL,
    "token_hash" TEXT         NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- Unique index on token_hash for fast O(1) lookup
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key"
    ON "password_reset_tokens"("token_hash");

-- Index on user_id for cleanup queries (delete old tokens on new request)
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx"
    ON "password_reset_tokens"("user_id");

-- Foreign key: cascade delete when a user is deleted
ALTER TABLE "password_reset_tokens"
    ADD CONSTRAINT IF NOT EXISTS "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
