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

-- --------------------------------------------------
-- CHARACTERS (Phase 2 of the Campaigns feature)
-- --------------------------------------------------
-- Deliberately minimal stub: just enough to hold a PC roster.
-- The full Characters feature (class/race/stats/etc.) extends this
-- table later. A character can be in at most one campaign at a
-- time (campaign_id is a single nullable FK, not a join table); one
-- person can still have multiple characters in the same campaign.
CREATE TABLE IF NOT EXISTS appdata.characters (
  character_id  UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES appdata.users(user_id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES appdata.campaigns(campaign_id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------
-- WORLD CONTENT (Phase 3 of the Campaigns feature)
-- --------------------------------------------------
-- Every row here is scoped to a campaign and carries
-- visible_to_players (default FALSE): the GM always sees
-- everything; a player only sees rows the GM has revealed.

CREATE TABLE IF NOT EXISTS appdata.cities (
  city_id             UUID PRIMARY KEY,
  campaign_id         UUID NOT NULL REFERENCES appdata.campaigns(campaign_id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  region              VARCHAR(255),
  notes               TEXT,
  visible_to_players  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appdata.npcs (
  npc_id              UUID PRIMARY KEY,
  campaign_id         UUID NOT NULL REFERENCES appdata.campaigns(campaign_id) ON DELETE CASCADE,
  city_id             UUID REFERENCES appdata.cities(city_id) ON DELETE SET NULL,
  name                VARCHAR(255) NOT NULL,
  role                VARCHAR(255),
  disposition         VARCHAR(50),
  notes               TEXT,
  visible_to_players  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appdata.items (
  item_id       UUID PRIMARY KEY,
  campaign_id   UUID NOT NULL REFERENCES appdata.campaigns(campaign_id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  value         NUMERIC(10,2),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appdata.shops (
  shop_id             UUID PRIMARY KEY,
  campaign_id         UUID NOT NULL REFERENCES appdata.campaigns(campaign_id) ON DELETE CASCADE,
  city_id             UUID REFERENCES appdata.cities(city_id) ON DELETE SET NULL,
  owner_npc_id        UUID REFERENCES appdata.npcs(npc_id) ON DELETE SET NULL,
  name                VARCHAR(255) NOT NULL,
  shop_type           VARCHAR(255),
  notes               TEXT,
  visible_to_players  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- sell_price is separate from items.value so the same item can be
-- priced differently shop to shop (markup/markdown, local rarity).
CREATE TABLE IF NOT EXISTS appdata.shop_inventory (
  shop_id     UUID NOT NULL REFERENCES appdata.shops(shop_id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES appdata.items(item_id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1,
  sell_price  NUMERIC(10,2),
  PRIMARY KEY (shop_id, item_id)
);

CREATE TABLE IF NOT EXISTS appdata.quests (
  quest_id            UUID PRIMARY KEY,
  campaign_id         UUID NOT NULL REFERENCES appdata.campaigns(campaign_id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- upcoming | active | resolved
  notes               TEXT,
  visible_to_players  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Every hook belongs to exactly one quest; campaign is reachable via
-- quest_id -> quests.campaign_id, so it isn't duplicated here.
CREATE TABLE IF NOT EXISTS appdata.hooks (
  hook_id             UUID PRIMARY KEY,
  quest_id            UUID NOT NULL REFERENCES appdata.quests(quest_id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- upcoming | active | resolved
  notes               TEXT,
  visible_to_players  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appdata.hook_npcs (
  hook_id UUID NOT NULL REFERENCES appdata.hooks(hook_id) ON DELETE CASCADE,
  npc_id  UUID NOT NULL REFERENCES appdata.npcs(npc_id) ON DELETE CASCADE,
  PRIMARY KEY (hook_id, npc_id)
);

CREATE TABLE IF NOT EXISTS appdata.hook_cities (
  hook_id UUID NOT NULL REFERENCES appdata.hooks(hook_id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES appdata.cities(city_id) ON DELETE CASCADE,
  PRIMARY KEY (hook_id, city_id)
);
