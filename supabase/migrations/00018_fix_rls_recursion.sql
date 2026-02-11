-- MidiMed v2: Fix RLS Infinite Recursion
-- Created: 2026-02-10
-- Description: Fix infinite recursion in users table RLS policy by using
-- a security definer function to safely get tenant_id without triggering
-- the users table policy again.

-- ============================================================================
-- STEP 1: Create a security definer function to get tenant_id
-- This function bypasses RLS to safely get the current user's tenant_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
$$;

-- Also create a function to get the current user's id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$;

-- ============================================================================
-- STEP 2: Drop the problematic policies
-- ============================================================================

-- Users table
DROP POLICY IF EXISTS "Users can view team members in their tenant" ON users;

-- Tenants table
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;

-- Patients table
DROP POLICY IF EXISTS "Users can view patients in their tenant" ON patients;
DROP POLICY IF EXISTS "Users can insert patients in their tenant" ON patients;
DROP POLICY IF EXISTS "Users can update patients in their tenant" ON patients;
DROP POLICY IF EXISTS "Users can delete patients in their tenant" ON patients;

-- Appointments table
DROP POLICY IF EXISTS "Users can view appointments in their tenant" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments in their tenant" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments in their tenant" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments in their tenant" ON appointments;

-- Medical records table
DROP POLICY IF EXISTS "Users can view medical records in their tenant" ON medical_records;
DROP POLICY IF EXISTS "Users can insert medical records in their tenant" ON medical_records;
DROP POLICY IF EXISTS "Users can update medical records in their tenant" ON medical_records;
DROP POLICY IF EXISTS "Users can delete medical records in their tenant" ON medical_records;

-- Notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications in their tenant" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Invites table
DROP POLICY IF EXISTS "Users can view invites in their tenant" ON invites;
DROP POLICY IF EXISTS "Users can insert invites in their tenant" ON invites;
DROP POLICY IF EXISTS "Users can update invites in their tenant" ON invites;
DROP POLICY IF EXISTS "Users can delete invites in their tenant" ON invites;

-- Documents table
DROP POLICY IF EXISTS "Users can view documents in their tenant" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their tenant" ON documents;
DROP POLICY IF EXISTS "Users can update documents in their tenant" ON documents;
DROP POLICY IF EXISTS "Users can delete documents in their tenant" ON documents;

-- Invoices table
DROP POLICY IF EXISTS "Users can view invoices in their tenant" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices in their tenant" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices in their tenant" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices in their tenant" ON invoices;

-- Patient files table
DROP POLICY IF EXISTS "Users can view patient files in their tenant" ON patient_files;
DROP POLICY IF EXISTS "Users can insert patient files in their tenant" ON patient_files;
DROP POLICY IF EXISTS "Users can update patient files in their tenant" ON patient_files;
DROP POLICY IF EXISTS "Users can delete patient files in their tenant" ON patient_files;

-- Payment events table
DROP POLICY IF EXISTS "Users can view payment events in their tenant" ON payment_events;
DROP POLICY IF EXISTS "Users can insert payment events in their tenant" ON payment_events;
DROP POLICY IF EXISTS "Users can update payment events in their tenant" ON payment_events;
DROP POLICY IF EXISTS "Users can delete payment events in their tenant" ON payment_events;

-- ============================================================================
-- STEP 3: Recreate policies using the security definer function
-- ============================================================================

-- USERS TABLE: Use auth_id directly to avoid self-referencing recursion
CREATE POLICY "Users can view team members in their tenant"
  ON users FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

-- TENANTS TABLE
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update their own tenant"
  ON tenants FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

-- PATIENTS TABLE
CREATE POLICY "Users can view patients in their tenant"
  ON patients FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert patients in their tenant"
  ON patients FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update patients in their tenant"
  ON patients FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete patients in their tenant"
  ON patients FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- APPOINTMENTS TABLE
CREATE POLICY "Users can view appointments in their tenant"
  ON appointments FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert appointments in their tenant"
  ON appointments FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update appointments in their tenant"
  ON appointments FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete appointments in their tenant"
  ON appointments FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- MEDICAL RECORDS TABLE
CREATE POLICY "Users can view medical records in their tenant"
  ON medical_records FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert medical records in their tenant"
  ON medical_records FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update medical records in their tenant"
  ON medical_records FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete medical records in their tenant"
  ON medical_records FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- NOTIFICATIONS TABLE
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    user_id = public.get_current_user_id()
    AND tenant_id = public.get_current_tenant_id()
  );

CREATE POLICY "Users can insert notifications in their tenant"
  ON notifications FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = public.get_current_user_id()
    AND tenant_id = public.get_current_tenant_id()
  );

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (
    user_id = public.get_current_user_id()
    AND tenant_id = public.get_current_tenant_id()
  );

-- INVITES TABLE
CREATE POLICY "Users can view invites in their tenant"
  ON invites FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert invites in their tenant"
  ON invites FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update invites in their tenant"
  ON invites FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete invites in their tenant"
  ON invites FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- DOCUMENTS TABLE
CREATE POLICY "Users can view documents in their tenant"
  ON documents FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert documents in their tenant"
  ON documents FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update documents in their tenant"
  ON documents FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete documents in their tenant"
  ON documents FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- INVOICES TABLE
CREATE POLICY "Users can view invoices in their tenant"
  ON invoices FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert invoices in their tenant"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update invoices in their tenant"
  ON invoices FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete invoices in their tenant"
  ON invoices FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- PATIENT FILES TABLE
CREATE POLICY "Users can view patient files in their tenant"
  ON patient_files FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert patient files in their tenant"
  ON patient_files FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can update patient files in their tenant"
  ON patient_files FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete patient files in their tenant"
  ON patient_files FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());

-- PAYMENT EVENTS TABLE
CREATE POLICY "Users can view payment events in their tenant"
  ON payment_events FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can insert payment events in their tenant"
  ON payment_events FOR INSERT
  WITH CHECK (
    tenant_id IS NULL OR tenant_id = public.get_current_tenant_id()
  );

CREATE POLICY "Users can update payment events in their tenant"
  ON payment_events FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Users can delete payment events in their tenant"
  ON payment_events FOR DELETE
  USING (tenant_id = public.get_current_tenant_id());
