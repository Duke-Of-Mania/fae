-- FAE database schema.
--
-- This file is the source-controlled record of what's live in the
-- appdata schema. Run the whole file against the dev database with:
--   psql "$DATABASE_URL" -f server/db/schema.sql
-- (or run each CREATE TABLE by hand). Every statement is IF NOT EXISTS,
-- so it's safe to re-run against a database that already has these tables.

CREATE SCHEMA IF NOT EXISTS appdata;

-- --------------------------------------------------
-- USERS (existing, documented here for the first time)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS appdata.users (
  user_id     UUID PRIMARY KEY,
  username    VARCHAR(50) NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  premium     BOOLEAN NOT NULL DEFAULT FALSE,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  pass_hash   VARCHAR(255) NOT NULL,
  last_login  TIMESTAMP,
  created     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------
-- SESSIONS (existing, documented here for the first time)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS appdata.sessions (
  _id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_token_hash  VARCHAR(64) NOT NULL UNIQUE,
  user_id             UUID NOT NULL REFERENCES appdata.users(user_id),
  expires_at          TIMESTAMP NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------
-- CAMPAIGNS (Phase 1 of the Campaigns feature)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS appdata.campaigns (
  campaign_id     UUID PRIMARY KEY,
  owner_user_id   UUID NOT NULL REFERENCES appdata.users(user_id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  overview        TEXT,
  world_overview  TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  invite_code     VARCHAR(12) UNIQUE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
