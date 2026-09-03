/*
# SchoolCare Connect — core schema

1. Purpose
   A school stationery & needs donation platform. A school posts specific item
   needs; public donors pledge items/quantities; an admin updates each donation's
   status (Pending -> Received -> Completed). Progress is visible in real time.

2. Tables
   - school_needs: items the school needs (item name, category, required/pledged/
     received quantities, priority, status, description).
   - donations: a donor's pledge against a need (donor contact, quantity, status,
     dates).
   - donation_history: append-only status-change log so donors can see the journey
     of their donation (Pending -> Received -> Completed).
   - survey: a single survey record describing the school population and
     demographic responses (stored as JSONB).
   - admins: authorization table listing which auth.users are admins. Admin-only
     writes are gated on membership here.

3. Derived quantities (kept in sync by triggers)
   - quantity_pledged  = SUM(donations.quantity) for the need (all statuses).
   - quantity_received = SUM(donations.quantity) for the need where status in
     (Received, Completed).
   - status = Closed when received >= required; else Partially Fulfilled when
     pledged > 0; else Open.
   A SECURITY DEFINER trigger function recomputes these whenever a donation is
   inserted, updated (status/quantity), or deleted, so public donors (anon role)
   can pledge even though they cannot directly UPDATE school_needs.

4. Security (RLS)
   - school_needs: public SELECT (anon, authenticated); admin-only INSERT/UPDATE/
     DELETE (membership in admins).
   - donations: public SELECT + INSERT (donors pledge without login); admin-only
     UPDATE/DELETE.
   - donation_history: public SELECT (donors track their donation); admin-only
     INSERT (created by the status-change function).
   - survey: public SELECT; admin-only INSERT/UPDATE/DELETE.
   - admins: authenticated SELECT (so a logged-in user can verify they are an
     admin); no public insert/delete.
*/

CREATE TABLE IF NOT EXISTS school_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Stationery','Bags','Books','Other')),
  quantity_required integer NOT NULL CHECK (quantity_required > 0),
  quantity_pledged integer NOT NULL DEFAULT 0 CHECK (quantity_pledged >= 0),
  quantity_received integer NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Partially Fulfilled','Closed')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  school_need_id uuid NOT NULL REFERENCES school_needs(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Received','Completed')),
  donation_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donations_school_need_id_idx ON donations(school_need_id);
CREATE INDEX IF NOT EXISTS donations_status_idx ON donations(status);

CREATE TABLE IF NOT EXISTS donation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donation_history_donation_id_idx ON donation_history(donation_id);

CREATE TABLE IF NOT EXISTS survey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  total_students integer NOT NULL CHECK (total_students >= 0),
  economically_weaker integer NOT NULL DEFAULT 0 CHECK (economically_weaker >= 0),
  responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE school_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

DROP POLICY IF EXISTS "public_read_needs" ON school_needs;
CREATE POLICY "public_read_needs" ON school_needs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_needs" ON school_needs;
CREATE POLICY "admin_insert_needs" ON school_needs FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_needs" ON school_needs;
CREATE POLICY "admin_update_needs" ON school_needs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_needs" ON school_needs;
CREATE POLICY "admin_delete_needs" ON school_needs FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "public_read_donations" ON donations;
CREATE POLICY "public_read_donations" ON donations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_donations" ON donations;
CREATE POLICY "public_insert_donations" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_donations" ON donations;
CREATE POLICY "admin_update_donations" ON donations FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_donations" ON donations;
CREATE POLICY "admin_delete_donations" ON donations FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "public_read_history" ON donation_history;
CREATE POLICY "public_read_history" ON donation_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_history" ON donation_history;
CREATE POLICY "admin_insert_history" ON donation_history FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_survey" ON survey;
CREATE POLICY "public_read_survey" ON survey FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_survey" ON survey;
CREATE POLICY "admin_insert_survey" ON survey FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_survey" ON survey;
CREATE POLICY "admin_update_survey" ON survey FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_read_admins" ON admins;
CREATE POLICY "auth_read_admins" ON admins FOR SELECT
  TO authenticated USING (true);

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
         COALESCE(SUM(quantity) FILTER (WHERE status IN ('Received','Completed')),0)
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

CREATE OR REPLACE FUNCTION trg_recompute_need()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM recompute_need(OLD.school_need_id);
  ELSE
    PERFORM recompute_need(NEW.school_need_id);
    IF (TG_OP = 'UPDATE' AND OLD.school_need_id IS DISTINCT FROM NEW.school_need_id) THEN
      PERFORM recompute_need(OLD.school_need_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS donations_recompute ON donations;
CREATE TRIGGER donations_recompute
AFTER INSERT OR UPDATE OR DELETE ON donations
FOR EACH ROW EXECUTE FUNCTION trg_recompute_need();