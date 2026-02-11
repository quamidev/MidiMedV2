-- MidiMed v2: Users table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Team members with auth linkage

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'provider', 'staff')),
  color TEXT DEFAULT '#3abdd4',                -- Calendar color (hex)
  avatar_url TEXT,
  invited_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- Comments
COMMENT ON TABLE users IS 'Team members linked to Supabase Auth and tenant';
COMMENT ON COLUMN users.auth_id IS 'Foreign key to Supabase auth.users';
COMMENT ON COLUMN users.role IS 'admin: full access, provider: sees own schedule, staff: limited';
COMMENT ON COLUMN users.color IS 'Hex color for calendar display';
