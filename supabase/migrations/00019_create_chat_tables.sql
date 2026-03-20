-- MidiMed v2: Chat Tables
-- Created: 2026-03-13
-- Ticket: CHAT-001 - Database Schema
-- Description: Tables for AI chat conversations and messages

-- ============================================================================
-- CHAT_CONVERSATIONS TABLE
-- Stores user chat conversation sessions
-- ============================================================================

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nueva conversacion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX idx_chat_conversations_tenant ON chat_conversations(tenant_id);

-- Comments
COMMENT ON TABLE chat_conversations IS 'AI chat conversation sessions per user';
COMMENT ON COLUMN chat_conversations.user_id IS 'Owner of the conversation';
COMMENT ON COLUMN chat_conversations.title IS 'Conversation title (default: Nueva conversacion)';

-- ============================================================================
-- CHAT_MESSAGES TABLE
-- Stores individual messages within a conversation
-- ============================================================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at ASC);

-- Comments
COMMENT ON TABLE chat_messages IS 'Individual messages within a chat conversation';
COMMENT ON COLUMN chat_messages.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN chat_messages.content IS 'Message content text';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHAT_CONVERSATIONS POLICIES
-- User-specific access within tenant (like notifications)
-- ============================================================================

CREATE POLICY "Users can view their own conversations"
  ON chat_conversations FOR SELECT
  USING (
    user_id = (
      SELECT u.id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (
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

CREATE POLICY "Users can update their own conversations"
  ON chat_conversations FOR UPDATE
  USING (
    user_id = (
      SELECT u.id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own conversations"
  ON chat_conversations FOR DELETE
  USING (
    user_id = (
      SELECT u.id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- CHAT_MESSAGES POLICIES
-- Access through conversation ownership
-- ============================================================================

CREATE POLICY "Users can read messages from own conversations"
  ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT cc.id FROM chat_conversations cc
      WHERE cc.user_id = (
        SELECT u.id FROM users u
        WHERE u.auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT cc.id FROM chat_conversations cc
      WHERE cc.user_id = (
        SELECT u.id FROM users u
        WHERE u.auth_id = auth.uid()
      )
    )
  );

-- Note: UPDATE and DELETE on messages typically not needed for chat
-- Messages are immutable; delete conversation to remove all messages

-- ============================================================================
-- POLICY COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view their own conversations" ON chat_conversations
  IS 'RLS: Users can only see their own chat conversations';
COMMENT ON POLICY "Users can insert their own conversations" ON chat_conversations
  IS 'RLS: Users can create conversations assigned to themselves within their tenant';
COMMENT ON POLICY "Users can update their own conversations" ON chat_conversations
  IS 'RLS: Users can update only their own conversations (e.g., title)';
COMMENT ON POLICY "Users can delete their own conversations" ON chat_conversations
  IS 'RLS: Users can delete their own conversations (cascades to messages)';

COMMENT ON POLICY "Users can read messages from own conversations" ON chat_messages
  IS 'RLS: Users can read messages from conversations they own';
COMMENT ON POLICY "Users can insert messages to own conversations" ON chat_messages
  IS 'RLS: Users can add messages to conversations they own';
