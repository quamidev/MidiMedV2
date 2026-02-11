-- MidiMed v2: Invites table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Team invitations

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'provider', 'staff')),

  invited_by UUID NOT NULL REFERENCES users(id),
  temp_password TEXT,                          -- Temp-XXXXXX format
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX idx_invites_tenant_id ON invites(tenant_id);
CREATE INDEX idx_invites_email ON invites(email);

-- Comments
COMMENT ON TABLE invites IS 'Pending team member invitations';
COMMENT ON COLUMN invites.temp_password IS 'Temporary password in Temp-XXXXXX format';
COMMENT ON COLUMN invites.status IS 'pending: awaiting acceptance, accepted: user created, expired: past expiration';
COMMENT ON COLUMN invites.expires_at IS 'Invitation expires 30 days after creation by default';
