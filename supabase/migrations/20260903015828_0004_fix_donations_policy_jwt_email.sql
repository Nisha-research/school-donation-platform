/*
# Fix Track Donation API error for signed-in users

## Problem
The previous migration (0003) fixed the "No donations found" issue by adding
an email-matching condition to the `user_read_own_donations` SELECT policy.
However, it used a subquery `SELECT email FROM auth.users WHERE id = auth.uid()`
to look up the authenticated user's email. The `authenticated` role does NOT
have SELECT permission on the `auth.users` table, so this subquery fails at
runtime, causing the entire donations query to return an error instead of
results. This manifests as "Could not look up donations. Please try again."
in the Track Donation page when signed in.

## Fix
Replace the `auth.users` subquery with `auth.jwt() ->> 'email'`, which reads
the user's email directly from their JWT token without needing to query the
`auth` schema. This avoids the permission error entirely.

The policy now reads: `auth.uid() = user_id OR is_admin() OR
donations.email = (auth.jwt() ->> 'email')`.

## Security
- Modified policy: `user_read_own_donations` on `donations` (SELECT only).
- No changes to INSERT/UPDATE/DELETE policies.
- Access remains scoped: a signed-in user can only see donations tied to
  their own email or their own user_id, plus admin access.
*/

DROP POLICY IF EXISTS "user_read_own_donations" ON donations;

CREATE POLICY "user_read_own_donations" ON donations FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR is_admin()
    OR donations.email = (auth.jwt() ->> 'email')
  );
