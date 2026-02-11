-- MidiMed v2: Row Level Security Policies
-- Created: 2026-02-10
-- Ticket: MV2-003 - Row Level Security Policies
-- Description: Enable RLS and create tenant isolation policies for multi-tenant security

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- Users can only access their own tenant
-- ============================================================================

CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tenant"
  ON tenants FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- Note: INSERT on tenants is handled by service role during signup
-- Note: DELETE on tenants is not allowed via client

-- ============================================================================
-- USERS TABLE POLICIES
-- Users can see all team members in their tenant
-- ============================================================================

CREATE POLICY "Users can view team members in their tenant"
  ON users FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (
    auth_id = auth.uid()
  );

-- Note: INSERT on users is handled by service role during signup/invite acceptance
-- Note: DELETE on users is handled by service role

-- ============================================================================
-- PATIENTS TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view patients in their tenant"
  ON patients FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert patients in their tenant"
  ON patients FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patients in their tenant"
  ON patients FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patients in their tenant"
  ON patients FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- APPOINTMENTS TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view appointments in their tenant"
  ON appointments FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert appointments in their tenant"
  ON appointments FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointments in their tenant"
  ON appointments FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete appointments in their tenant"
  ON appointments FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- MEDICAL_RECORDS TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view medical records in their tenant"
  ON medical_records FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medical records in their tenant"
  ON medical_records FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medical records in their tenant"
  ON medical_records FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medical records in their tenant"
  ON medical_records FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- Special case: User-specific access within tenant
-- Users can only see their own notifications
-- ============================================================================

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    user_id = (
      SELECT u.id FROM users u
      WHERE u.auth_id = auth.uid()
    )
    AND
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notifications in their tenant"
  ON notifications FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = (
      SELECT u.id FROM users u
      WHERE u.auth_id = auth.uid()
    )
    AND
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (
    user_id = (
      SELECT u.id FROM users u
      WHERE u.auth_id = auth.uid()
    )
    AND
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- INVITES TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view invites in their tenant"
  ON invites FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invites in their tenant"
  ON invites FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invites in their tenant"
  ON invites FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invites in their tenant"
  ON invites FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- DOCUMENTS TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view documents in their tenant"
  ON documents FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their tenant"
  ON documents FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their tenant"
  ON documents FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in their tenant"
  ON documents FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- INVOICES TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view invoices in their tenant"
  ON invoices FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoices in their tenant"
  ON invoices FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices in their tenant"
  ON invoices FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices in their tenant"
  ON invoices FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- PATIENT_FILES TABLE POLICIES
-- Full CRUD within tenant
-- ============================================================================

CREATE POLICY "Users can view patient files in their tenant"
  ON patient_files FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert patient files in their tenant"
  ON patient_files FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patient files in their tenant"
  ON patient_files FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patient files in their tenant"
  ON patient_files FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- PAYMENT_EVENTS TABLE POLICIES
-- Tenant-scoped access (tenant_id is nullable for events before tenant association)
-- ============================================================================

CREATE POLICY "Users can view payment events in their tenant"
  ON payment_events FOR SELECT
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert payment events in their tenant"
  ON payment_events FOR INSERT
  WITH CHECK (
    tenant_id IS NULL OR tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update payment events in their tenant"
  ON payment_events FOR UPDATE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete payment events in their tenant"
  ON payment_events FOR DELETE
  USING (
    tenant_id = (
      SELECT u.tenant_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- PLAN_CATALOG TABLE POLICIES
-- Special case: Public read access (no auth required)
-- Write access only via service role
-- ============================================================================

CREATE POLICY "Anyone can view plan catalog"
  ON plan_catalog FOR SELECT
  USING (true);

-- Note: INSERT, UPDATE, DELETE on plan_catalog is handled by service role only

-- ============================================================================
-- LEADS TABLE POLICIES
-- Special case: Public insert (contact form)
-- Read access only via service role
-- ============================================================================

CREATE POLICY "Anyone can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Note: SELECT, UPDATE, DELETE on leads is handled by service role only

-- ============================================================================
-- UTM_CAMPAIGNS TABLE POLICIES
-- Special case: Public insert (tracking)
-- Read access only via service role
-- ============================================================================

CREATE POLICY "Anyone can insert utm campaigns"
  ON utm_campaigns FOR INSERT
  WITH CHECK (true);

-- Note: SELECT, UPDATE, DELETE on utm_campaigns is handled by service role only

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view their own tenant" ON tenants IS 'RLS: Tenant isolation for viewing tenant data';
COMMENT ON POLICY "Users can update their own tenant" ON tenants IS 'RLS: Tenant isolation for updating tenant settings';

COMMENT ON POLICY "Users can view team members in their tenant" ON users IS 'RLS: View all team members within the same tenant';
COMMENT ON POLICY "Users can update their own profile" ON users IS 'RLS: Users can only update their own user record';

COMMENT ON POLICY "Users can view their own notifications" ON notifications IS 'RLS: Users can only see their own notifications within their tenant';

COMMENT ON POLICY "Anyone can view plan catalog" ON plan_catalog IS 'RLS: Public read access for pricing display';
COMMENT ON POLICY "Anyone can insert leads" ON leads IS 'RLS: Public insert for contact form submissions';
COMMENT ON POLICY "Anyone can insert utm campaigns" ON utm_campaigns IS 'RLS: Public insert for marketing tracking';
