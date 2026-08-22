-- Erilog Database Schema
-- Designed per: .kiro/specs/erilog-core/design.md Section 2

-- 1. Missions
CREATE TABLE missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'closed')),
  total_stock   JSONB NOT NULL,
  activated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Policy Versions (immutable after activation)
CREATE TABLE policy_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    UUID NOT NULL REFERENCES missions(id),
  version       INTEGER NOT NULL,
  policy        JSONB NOT NULL,
  policy_hash   TEXT NOT NULL,
  activated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, version)
);

-- 3. Devices
CREATE TABLE devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES missions(id),
  label           TEXT NOT NULL,
  allocation      JSONB NOT NULL,
  package_hash    TEXT,
  provisioned_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, label)
);

-- 4. Events (append-only)
CREATE TABLE events (
  id              UUID PRIMARY KEY,
  mission_id      UUID NOT NULL REFERENCES missions(id),
  device_id       UUID NOT NULL REFERENCES devices(id),
  policy_version  INTEGER NOT NULL,
  sequence        INTEGER NOT NULL CHECK (sequence >= 0),
  token_hash      TEXT NOT NULL,
  item_type       TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  device_time     TIMESTAMPTZ NOT NULL,
  previous_hash   TEXT NOT NULL,
  event_hash      TEXT NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, sequence),
  FOREIGN KEY (mission_id, policy_version)
    REFERENCES policy_versions(mission_id, version)
);

-- 5. Reconciliation Snapshots (immutable projections)
CREATE TABLE reconciliation_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id        UUID NOT NULL REFERENCES missions(id),
  event_set_digest  TEXT NOT NULL,
  summary           JSONB NOT NULL,
  exceptions        JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, event_set_digest)
);

-- 6. Resolutions (P1, append-only)
CREATE TABLE resolutions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES missions(id),
  exception_id    TEXT NOT NULL,
  snapshot_id     UUID NOT NULL REFERENCES reconciliation_snapshots(id),
  actor           TEXT NOT NULL,
  disposition     TEXT NOT NULL
                    CHECK (disposition IN ('explained', 'authorized', 'investigate')),
  reason          TEXT NOT NULL,
  source_event_ids UUID[] NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Judge Sessions
CREATE TABLE judge_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash      TEXT NOT NULL UNIQUE,
  mission_id      UUID REFERENCES missions(id),
  seed            INTEGER NOT NULL DEFAULT 42,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutability enforcement
REVOKE UPDATE, DELETE ON policy_versions FROM app_role;
REVOKE UPDATE, DELETE ON events FROM app_role;
REVOKE UPDATE, DELETE ON resolutions FROM app_role;
REVOKE UPDATE, DELETE ON reconciliation_snapshots FROM app_role;
