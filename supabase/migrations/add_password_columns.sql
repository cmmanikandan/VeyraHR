-- =========================================================================
-- Migration: Add password columns to profiles, employees, hr_managers
-- Run this in Supabase SQL Editor to enable cross-device login
-- =========================================================================

-- Add password column to profiles table (used for login verification)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password column to employees table (stores employee login password)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password column to hr_managers table (stores HR login password)
ALTER TABLE public.hr_managers
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Verification: Confirm columns exist
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'password'
  AND table_name IN ('profiles', 'employees', 'hr_managers');
