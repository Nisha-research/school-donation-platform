/*
# Fix Track Donation bug for signed-in users

## Problem
When a signed-in user searches for donations by email on the Track Donation
page, they get "No donations found" even though donations exist for that email.
This happens because the `user_read_own_donations` SELECT policy restricts
authenticated users to rows where `user_id = auth.uid()` OR they are an admin.
Donations pledged without login have `user_id = NULL`, so they are filtered out
by RLS for authenticated users. Anonymous users see all donations via
`anon_read_donations` (USING true), which is why tracking works when not signed in.

## Fix
Update the `user_read_own_donations` SELECT policy to also allow authenticated
users to read donations matching their own account email. This way, an
authenticated user searching by email sees the same donations an anonymous
user would see for that email — donations they pledged with that email
(regardless of whether user_id was set), plus any donations where user_id
matches their auth ID.

The policy now reads: `auth.uid() = user_id OR is_admin() OR
donations.email = (the authenticated user's email from auth.users)`.

This keeps access scoped: a signed-in user can only see donations tied to
their own email or their own user_id, plus admin access. They cannot see
other users' donations.

## Security
- No new tables or columns.
- Modified policy: `user_read_own_donations` on `donations` (SELECT).
- No changes to INSERT/UPDATE/DELETE policies.
*/

DROP POLICY IF EXISTS "user_read_own_donations" ON donations;

CREATE POLICY "user_read_own_donations" ON donations FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR is_admin()
    OR donations.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
