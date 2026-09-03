# SchoolCare Connect - Bug Fixes Summary

## Overview
Fixed three critical UI/UX and authentication issues in the school donation platform.

---

## Issue #1: Admin Login Fails When Admin Credentials Are Entered

### Problem
When admin credentials were submitted on the "Admin" tab, the page redirected immediately after sign-in **before** verifying whether the user was actually an admin. This allowed non-admin users to bypass the authentication check.

### Root Cause
In `SignInPage.tsx`, the effect that handles redirects was triggered as soon as `user` became non-null, without waiting for the `isAdmin` status check to complete asynchronously in the `AuthProvider`.

### Solution
Added an `expectingAdminCheck` state flag to coordinate the redirect:
- When admin sign-in succeeds, set `expectingAdminCheck = true` and wait
- Only redirect after both `user` exists AND `isAdmin` status has been verified
- If `isAdmin` is false, show error and sign out

**Commits:**
- `f6effa46` - Fix Issue #1: Admin login now waits for admin status check before redirecting

---

## Issue #2: Authenticated Donors Cannot Create Donations

### Problem
When a donor created an account and attempted to pledge a donation, the donation was rejected or failed. However, admin users and unauthenticated donors could pledge successfully.

### Root Cause
The `DonationFormPage` was not capturing the authenticated user's ID. Without `user_id`, the system couldn't link the donation to the authenticated account, causing validation or permission issues.

### Solution
1. Import `useAuth` hook to access the current user
2. Capture `user?.id` when submitting the donation form
3. Pass `user_id` to `createDonation()` (already supported in type definition)

**Commits:**
- `14967ad4` - Fix: quantity calculation and pass user_id for authenticated donors

---

## Issue #3: Incorrect "Still Needed" Quantity Display and Donation Limits

### Problem
The donation form showed conflicting information:
- The card displayed "**30** still needed"
- But the quantity input limited donations to only **3** items
- This happened consistently across all items with pending donations

**Example from screenshots:**
- Notebooks: Shows "30 still needed" but allows max 3 donations
- Other items: Same pattern

### Root Cause
The calculation used `quantity_required - quantity_pledged`:
- `quantity_pledged` includes ALL pending donations (those not yet received)
- This incorrectly reduced available quantity by pending items

The database schema's actual logic:
- `quantity_received` = only completed/received donations count
- "Still needed" should be `quantity_required - quantity_received`
- This matches the database trigger `recompute_need()` in the schema

### Solution
Changed the remaining calculation in `DonationFormPage.tsx`:
```typescript
// OLD (incorrect)
const remaining = need.quantity_required - need.quantity_pledged;

// NEW (correct)
const remaining = need.quantity_required - need.quantity_received;
```

This now correctly shows:
- If 30 items needed and 0 received → 30 available
- If 30 items needed and 10 received → 20 available
- Matches the backend trigger logic

**Additional improvements:**
- Added realtime subscription to reflect live quantity updates
- Error message now says "only X more **can be fulfilled**" (clearer language)

**Commits:**
- `14967ad4` - Fix: quantity calculation and pass user_id for authenticated donors

---

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/SignInPage.tsx` | Added `expectingAdminCheck` state to wait for async admin verification before redirect |
| `src/pages/DonationFormPage.tsx` | 1. Fixed quantity calculation (pledged → received)<br>2. Added user_id capture via useAuth<br>3. Added realtime subscription for live updates |

---

## Testing Checklist

- [ ] **Admin Login**: Sign in with admin credentials → should redirect to `/admin`
- [ ] **Non-Admin Rejection**: Sign in with non-admin credentials on Admin tab → should show error and not redirect
- [ ] **Authenticated Donor**: Create account, try to donate → donation should succeed and be linked to account
- [ ] **Quantity Calculation**: Check item with 30 needed, some received:
  - Card should show correct remaining count
  - Input max should allow donation up to remaining amount
  - Realtime: When status changes, quantities should update immediately

---

## Database Alignment

The fixes now correctly align with the database schema:
- `recompute_need()` trigger counts only `Received` and `Completed` donations
- Status is `Closed` when `received >= required`
- Status is `Partially Fulfilled` when `pledged > 0`
- "Still needed" = `quantity_required - quantity_received`

