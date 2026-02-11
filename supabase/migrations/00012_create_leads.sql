-- MidiMed v2: Leads table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Contact form submissions

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,

  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  source TEXT NOT NULL DEFAULT 'contact-form',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE leads IS 'Contact form submissions from landing page';
COMMENT ON COLUMN leads.status IS 'new: unprocessed, contacted: reached out, converted: became tenant, closed: no conversion';
COMMENT ON COLUMN leads.source IS 'Lead source, default is contact-form';
