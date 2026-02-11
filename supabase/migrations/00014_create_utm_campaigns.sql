-- MidiMed v2: UTM Campaigns table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Marketing tracking

CREATE TABLE utm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  full_url TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE utm_campaigns IS 'Marketing campaign tracking from URL parameters';
COMMENT ON COLUMN utm_campaigns.full_url IS 'Full URL with UTM parameters';
COMMENT ON COLUMN utm_campaigns.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN utm_campaigns.referer IS 'HTTP referer header value';
