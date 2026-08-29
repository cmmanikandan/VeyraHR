-- =========================================================================
-- Migration: Add missing columns to public.branches table
-- Run this in Supabase SQL Editor so new branches persist across devices
-- =========================================================================

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Tamil Nadu',
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC DEFAULT 12.9654,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC DEFAULT 80.2461,
  ADD COLUMN IF NOT EXISTS radius_meters INT DEFAULT 150,
  ADD COLUMN IF NOT EXISTS working_hours VARCHAR(100) DEFAULT '09:00 AM - 06:00 PM',
  ADD COLUMN IF NOT EXISTS is_headquarters BOOLEAN DEFAULT FALSE;

-- Verification:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'branches';
