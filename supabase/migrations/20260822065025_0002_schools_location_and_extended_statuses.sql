/*
# Schools table, user-linked donations, and 5-step donation status

## Purpose
Adds a `schools` table with geographic coordinates so each need listing can show
an interactive map. Links donations to the authenticated donor (user_id) so logged-in
users can see "My Donations". Expands the donation status lifecycle from 3 steps
(Pending -> Received -> Completed) to 5 steps:
  Pledged -> Confirmed -> Collected -> Delivered -> Completed

## 1. New Table: schools
- `id` (uuid PK)
- `name` (text, not null) — school display name
- `address` (text) — full street address
- `latitude` (numeric) — decimal latitude for map marker
- `longitude` (numeric) — decimal longitude for map marker
- `created_at` (timestamptz)

## 2. Modified Table: school_needs
- Added `school_id` (uuid, nullable FK -> schools) so each need belongs to a school.

## 3. Modified Table: donations
- Added `user_id` (uuid, nullable FK -> auth.users) so logged-in donors can retrieve
  their own donations.
- Expanded `status` CHECK constraint to 5 values:
  'Pledged','Confirmed','Collected','Delivered','Completed'
- Default status changed to 'Pledged'.
- Existing 'Pending' rows migrated to 'Pledged'; 'Received' to 'Delivered'.

## 4. Security (RLS)
- `schools`: public SELECT; admin-only INSERT/UPDATE/DELETE.
- `donations`: authenticated users can read their own donations OR any if admin;
  anon can still read all donations.
- INSERT on donations: anon + authenticated can insert.
- UPDATE/DELETE on donations: admin-only.

## 5. Data
- Inserts one default school ("Green Valley Government School") with coordinates
  in Bengaluru, India, and back-fills existing school_needs rows to reference it.

## 6. Important notes
- The recompute trigger function is updated to treat 'Delivered' and 'Completed'
  as "received" for quantity_received calculations.
*/

-- ===== schools table =====
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_schools" ON schools;
CREATE POLICY "public_read_schools" ON schools FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_schools" ON schools;
CREATE POLICY "admin_insert_schools" ON schools FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_schools" ON schools;
CREATE POLICY "admin_update_schools" ON schools FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_schools" ON schools;
CREATE POLICY "admin_delete_schools" ON schools FOR DELETE
  TO authenticated USING (is_admin());

-- ===== school_needs: add school_id =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'school_needs' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE school_needs ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===== donations: add user_id =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE donations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===== donations: expand status to 5-step lifecycle =====
-- Step 1: Drop old CHECK constraint
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'donations' AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%Pending%Received%Completed%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE donations DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Step 2: Migrate existing data BEFORE adding new constraint
UPDATE donations SET status = 'Pledged' WHERE status = 'Pending';
UPDATE donations SET status = 'Delivered' WHERE status = 'Received';

-- Step 3: Add new CHECK constraint
ALTER TABLE donations ADD CONSTRAINT donations_status_check
  CHECK (status IN ('Pledged','Confirmed','Collected','Delivered','Completed'));

-- Step 4: Update default
ALTER TABLE donations ALTER COLUMN status SET DEFAULT 'Pledged';

-- ===== donations RLS: allow users to read their own donations =====
DROP POLICY IF EXISTS "public_read_donations" ON donations;
DROP POLICY IF EXISTS "user_read_own_donations" ON donations;
DROP POLICY IF EXISTS "anon_read_donations" ON donations;

CREATE POLICY "user_read_own_donations" ON donations FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "anon_read_donations" ON donations FOR SELECT
  TO anon USING (true);

-- INSERT: anon + authenticated (preserves existing public pledge flow)
DROP POLICY IF EXISTS "public_insert_donations" ON donations;
CREATE POLICY "public_insert_donations" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- UPDATE/DELETE: admin-only (unchanged)
DROP POLICY IF EXISTS "admin_update_donations" ON donations;
CREATE POLICY "admin_update_donations" ON donations FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_donations" ON donations;
CREATE POLICY "admin_delete_donations" ON donations FOR DELETE
  TO authenticated USING (is_admin());

-- ===== Update recompute trigger for new statuses =====
CREATE OR REPLACE FUNCTION recompute_need(p_need_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pledged integer;
  v_received integer;
  v_required integer;
  v_new_status text;
BEGIN
  SELECT COALESCE(SUM(quantity),0),
         COALESCE(SUM(quantity) FILTER (WHERE status IN ('Collected','Delivered','Completed')),0)
  INTO v_pledged, v_received
  FROM donations WHERE school_need_id = p_need_id;

  SELECT quantity_required INTO v_required FROM school_needs WHERE id = p_need_id;

  IF v_received >= v_required THEN
    v_new_status := 'Closed';
  ELSIF v_pledged > 0 THEN
    v_new_status := 'Partially Fulfilled';
  ELSE
    v_new_status := 'Open';
  END IF;

  UPDATE school_needs
  SET quantity_pledged = v_pledged,
      quantity_received = v_received,
      status = v_new_status
  WHERE id = p_need_id;
END;
$$;

-- ===== Seed default school and back-fill existing needs =====
INSERT INTO schools (name, address, latitude, longitude)
VALUES (
  'Green Valley Government School',
  'Green Valley, Bengaluru, Karnataka 560001, India',
  12.971599,
  77.594566
)
ON CONFLICT DO NOTHING;

UPDATE school_needs
SET school_id = (SELECT id FROM schools WHERE name = 'Green Valley Government School' LIMIT 1)
WHERE school_id IS NULL;