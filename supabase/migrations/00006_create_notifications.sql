-- MidiMed v2: Notifications table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: In-app notifications

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general',                 -- 'appointment_created', 'appointment_cancelled', etc.
  metadata JSONB DEFAULT '{}'::jsonb,          -- { appointment_id, patient_id, etc. }

  is_read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, tenant_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Comments
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON COLUMN notifications.type IS 'Notification type: general, appointment_created, appointment_cancelled, etc.';
COMMENT ON COLUMN notifications.metadata IS 'Additional data like appointment_id, patient_id';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration timestamp';
