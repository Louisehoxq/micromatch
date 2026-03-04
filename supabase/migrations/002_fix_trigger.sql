-- Fix: Change role column from enum to TEXT to avoid cast issues in trigger
-- and make the trigger more robust

-- Drop the old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Change role column to TEXT (more robust with triggers)
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Recreate with safer trigger that won't fail on cast
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_role := NEW.raw_user_meta_data->>'role';
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- Only accept valid roles
  IF v_role NOT IN ('jobber', 'creator') THEN
    v_role := NULL;
  END IF;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, v_role, v_name);

  IF v_role = 'jobber' THEN
    INSERT INTO public.jobber_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  -- Still create a basic profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
