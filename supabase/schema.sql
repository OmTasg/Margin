-- ==============================================================================
-- Supabase PostgreSQL Schema for Mobile PWA Task Manager (Canvas + GCal)
-- ==============================================================================

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_reminder_lead_time_minutes INTEGER NOT NULL DEFAULT 15,
    canvas_ics_url TEXT,
    canvas_last_synced_at TIMESTAMPTZ,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expiry TIMESTAMPTZ,
    google_selected_calendar_id TEXT NOT NULL DEFAULT 'primary',
    google_auto_push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    google_user_email TEXT,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    priority TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P1', 'P2', 'P3')),
    due_date TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    reminder_lead_time_minutes INTEGER NOT NULL DEFAULT 15,
    estimated_duration_minutes INTEGER,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'canvas')),
    external_url TEXT,
    course_name TEXT,
    canvas_uid TEXT,
    google_event_id TEXT,
    google_calendar_id TEXT,
    is_pushed_to_google BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_canvas_uid ON public.tasks(canvas_uid);
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON public.tasks(google_event_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 5. Automatic `updated_at` Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to read, insert, update, and delete only their own records
-- (Supports both authenticated users and anonymous single-user development mode)
CREATE POLICY "Users can manage their own tasks"
    ON public.tasks
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL);
