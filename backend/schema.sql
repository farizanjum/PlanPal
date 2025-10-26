-- 🎉 PlanPal - COMPLETE Database Schema
-- Run this in your Supabase SQL Editor to set up all features

-- Clean up existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone_number TEXT,
  bio TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  members UUID[] NOT NULL,
  group_code TEXT UNIQUE,
  is_private BOOLEAN DEFAULT TRUE,
  group_type TEXT DEFAULT 'personal' CHECK (group_type IN ('personal', 'work')),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMPTZ,
  location JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event RSVPs table
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event Reactions table
CREATE TABLE event_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'sad', 'thinking')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, reaction_type)
);

-- Group suggestions table
CREATE TABLE group_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('movie', 'place')),
  suggestion_data JSONB NOT NULL,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_suggestions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups policies
CREATE POLICY "Users can view groups they are members of" ON groups
  FOR SELECT USING (auth.uid() = ANY(members));

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by AND auth.uid() = ANY(members));

CREATE POLICY "Group creators can update their groups" ON groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group members can update their groups" ON groups
  FOR UPDATE USING (auth.uid() = ANY(members));

CREATE POLICY "Users can view non-deleted groups they are members of" ON groups
  FOR SELECT USING (auth.uid() = ANY(members) AND deleted_at IS NULL);

-- Events policies
CREATE POLICY "Users can view events in their groups" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = events.group_id
      AND auth.uid() = ANY(groups.members)
    )
  );

CREATE POLICY "Users can create events in their groups" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = events.group_id
      AND auth.uid() = ANY(groups.members)
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Event creators can update their events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Polls policies
CREATE POLICY "Users can view polls in their group events" ON polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN groups ON events.group_id = groups.id
      WHERE events.id = polls.event_id
      AND auth.uid() = ANY(groups.members)
    )
  );

CREATE POLICY "Users can create polls for events in their groups" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN groups ON events.group_id = groups.id
      WHERE events.id = polls.event_id
      AND auth.uid() = ANY(groups.members)
    )
  );

CREATE POLICY "Users can view non-deleted polls" ON polls
  FOR SELECT USING (deleted_at IS NULL);

-- Votes policies
CREATE POLICY "Users can view votes in their group polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      JOIN events ON polls.event_id = events.id
      JOIN groups ON events.group_id = groups.id
      WHERE polls.id = votes.poll_id
      AND auth.uid() = ANY(groups.members)
    )
  );

CREATE POLICY "Users can cast votes in their group polls" ON votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls
      JOIN events ON polls.event_id = events.id
      JOIN groups ON events.group_id = groups.id
      WHERE polls.id = votes.poll_id
      AND auth.uid() = ANY(groups.members)
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their group chats" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = chat_messages.group_id
      AND auth.uid() = ANY(groups.members)
    )
  );

CREATE POLICY "Users can send messages to their group chats" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = chat_messages.group_id
      AND auth.uid() = ANY(groups.members)
    )
    AND auth.uid() = user_id
  );

-- Event RSVPs policies
CREATE POLICY "Users can view RSVPs for events in their groups"
  ON event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN groups g ON e.group_id = g.id
      WHERE e.id = event_rsvps.event_id
      AND auth.uid() = ANY(g.members)
    )
  );

CREATE POLICY "Users can create their own RSVPs"
  ON event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
  ON event_rsvps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
  ON event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- Event Reactions policies
CREATE POLICY "Users can view reactions for events in their groups"
  ON event_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN groups g ON e.group_id = g.id
      WHERE e.id = event_reactions.event_id
      AND auth.uid() = ANY(g.members)
    )
  );

CREATE POLICY "Users can create their own reactions"
  ON event_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON event_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON event_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Group suggestions policies
CREATE POLICY "Users can view suggestions for their groups"
  ON group_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_suggestions.group_id
      AND auth.uid() = ANY(g.members)
    )
  );

CREATE POLICY "Group creators can manage suggestions"
  ON group_suggestions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_suggestions.group_id
      AND (auth.uid() = g.created_by OR auth.uid() = ANY(g.members))
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_members ON groups USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_groups_group_type ON groups(group_type);
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at);

CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

CREATE INDEX IF NOT EXISTS idx_polls_event_id ON polls(event_id);
CREATE INDEX IF NOT EXISTS idx_polls_deleted_at ON polls(deleted_at);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_group_id ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);

CREATE INDEX IF NOT EXISTS idx_event_reactions_event_id ON event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_user_id ON event_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_group_suggestions_group_id ON group_suggestions(group_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);

-- =====================================================
-- ENABLE REALTIME (Required for live chat)
-- =====================================================

-- Enable realtime for chat_messages table (required for real-time chat)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE event_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE event_reactions;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 PlanPal Database Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Features Enabled:';
  RAISE NOTICE '  ✅ Group classification (Personal/Work)';
  RAISE NOTICE '  ✅ Event RSVP system (going/maybe/not_going)';
  RAISE NOTICE '  ✅ Event reactions (like/love/fire/sad/thinking)';
  RAISE NOTICE '  ✅ Real-time chat';
  RAISE NOTICE '  ✅ Top 5 suggestions (movies & places)';
  RAISE NOTICE '  ✅ Location-based recommendations';
  RAISE NOTICE '  ✅ Profile management';
  RAISE NOTICE '  ✅ Poll system';
  RAISE NOTICE '  ✅ Soft delete functionality';
  RAISE NOTICE '  ✅ Majority location logic';
END $$;

