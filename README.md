# SchoolCare Connect

A school stationery & needs donation platform where a school posts specific item needs, donors pledge items, and the entire donation process is tracked visually in real time.

## Features

- **Home Page** — Hero with school statistics, overall donation progress, mission, and featured urgent needs.
- **School Needs Page** — Grid of all current needs with progress bars (pledged vs received vs required), category and priority filters, and a "Donate This" button on each card.
- **Donation Form** — Pre-filled item summary, donor details with validation, quantity selector. No login required.
- **Success / Confirmation Page** — Animated checkmark, donation summary, status journey timeline (Pending → Received → Completed), and status history log.
- **Survey Report** — Summary cards, pie chart (demographic breakdown), bar chart (required vs received by item), priority ranking table, challenges and recommendations.
- **Admin Dashboard** (login required) — KPI cards (open needs, total donations, fulfilment rate, completed), donation status management table, add/edit/delete school needs.

## Visual Process Transparency

- Progress bars on every need show pledged (orange) and received (green) quantities with a percentage badge.
- Status badges are color-coded: grey (Pending), orange (Received), green (Completed).
- When admin updates a donation status, the database trigger automatically recomputes the need's pledged/received/status, and Supabase Realtime pushes the update to all connected browsers — progress bars update instantly without a page refresh.
- The Success page shows a step-by-step journey of the donation with a status history log.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Chart.js + Lucide React icons
- **Backend/Database**: Supabase (PostgreSQL with Row Level Security, realtime subscriptions, auth)
- **Authentication**: Supabase email/password auth for admin only

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier at [supabase.com](https://supabase.com))

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   The `VITE_` prefixed vars are used by the frontend; the non-prefixed vars are used by the seed script.

3. Run the database migration:
   - The schema is in `supabase/migrations/20260821154322_0001_schoolcare_schema.sql`
   - Apply it via the Supabase SQL Editor or the Supabase dashboard.

4. Seed sample data:
   ```bash
   npm run seed
   ```
   This inserts 5 school needs, 8 sample donations across all statuses, and a survey record.

5. Provision the admin account:
   - Deploy the edge function in `supabase/functions/admin-bootstrap/` via Supabase dashboard.
   - Send a POST request to the function endpoint to create the admin user.
   - Or create a user in Supabase Auth and insert their ID into the `admins` table.

6. Start the dev server:
   ```bash
   npm run dev
   ```

## Admin Access

- **Email**: `admin@schoolcare.org`
- **Password**: `schoolcare2026`
- The login page has a "Click to fill" button for convenience.

## Database Schema

| Table | Purpose |
|-------|---------|
| `school_needs` | Items the school needs, with required/pledged/received quantities, priority, and status |
| `donations` | Donor pledges against specific needs, with status tracking |
| `donation_history` | Append-only log of status changes for each donation |
| `survey` | School population survey data with demographic responses |
| `admins` | Authorization table linking Supabase auth users to admin role |

A database trigger (`donations_recompute`) automatically recalculates each need's pledged/received/status whenever a donation is inserted, updated, or deleted.

## Realtime Updates

The `school_needs` and `donations` tables are added to the Supabase Realtime publication. The frontend subscribes to changes, so:

- When a donor submits a donation, all open pages update their progress bars.
- When an admin changes a donation status, the need's progress bar updates everywhere instantly.

## Color Scheme

- **Primary**: Navy `#1F3864`
- **Secondary**: Ocean Blue `#2E75B6`
- **CTA**: Orange `#C55A11`
- **Success**: Green `#2f8138`
- **Warning**: Amber `#d18d1a`
- **Error**: Red `#b93535`
