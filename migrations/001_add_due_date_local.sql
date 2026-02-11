-- =================================================================
-- MIGRATION: Add due_date_local column for timezone-agnostic dates
-- Run this in Supabase SQL Editor
-- =================================================================

-- 1. Add the new column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date_local TEXT;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS tasks_due_date_local_idx 
ON public.tasks(due_date_local);

-- 3. Migrate existing data
-- NOTE: Adjust the timezone ('America/New_York') to match where your tasks were originally created
-- This converts the timestamp to a YYYY-MM-DD string in that timezone
UPDATE public.tasks 
SET due_date_local = TO_CHAR(
    TO_TIMESTAMP(due_date / 1000.0) AT TIME ZONE 'America/New_York',
    'YYYY-MM-DD'
)
WHERE due_date_local IS NULL AND due_date IS NOT NULL;

-- 4. Verify the migration
SELECT id, title, due_date, due_date_local FROM public.tasks LIMIT 10;
