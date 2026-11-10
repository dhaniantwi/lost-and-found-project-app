# CampusFind Supabase setup

CampusFind uses the separate Supabase project `CampusFind` (project ref: `ixpffnxjdprijkfifkfo`). The existing `jewels-music-bank` project is not used or modified by CampusFind.

## Live database

The following objects are provisioned in the CampusFind project:

- `profiles`: private student profile and trusted role information, linked to Supabase Auth.
- `item_reports`: lost/found report records. The table contains no reporter phone number or email.
- `item_catalog`: safe catalog view for anonymous browsing; excludes reporter identifiers and private ownership notes.
- `report_private_details`: owner/admin-only distinctive ownership marks.
- `claims`: private ownership claims, visible only to the claimant and administrators.
- `audit_logs`: protected audit history.
- `private.is_campusfind_admin()`: non-exposed helper used by RLS policies.

All exposed application tables have Row Level Security enabled. The security advisor was checked after setup and returned no security findings.

## Storage

Two private buckets are configured, each with a 5 MB upload limit:

- `item-photos`: item photographs. Authenticated users can read photos; uploads are restricted to the uploader's UUID folder.
- `claim-evidence`: supporting claim evidence. Only the claimant and trusted administrators can read the files.

The browser uses signed URLs for private objects. Do not make these buckets public.

## Authentication and administrator access

- Supabase Auth handles sign-up, sign-in, session persistence, and password security.
- A database trigger creates a `profiles` row after registration.
- Every new account receives the `student` role.
- The browser cannot assign or update the `role` column. Administrator promotion must be performed by a trusted project owner after verifying the account.
- Never place a Supabase secret/service-role key in frontend code. The Vite app uses only the publishable key.

## GitHub Pages redirect configuration

In the Supabase dashboard, open **Authentication → URL Configuration** and set:

- Site URL: `https://dhaniantwi.github.io/lost-and-found-project-app/`
- Additional Redirect URL: `https://dhaniantwi.github.io/lost-and-found-project-app/`

This is required for email-confirmation links to return to the deployed app.

## Environment

The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The public project URL and publishable key are also configured as safe fallbacks in `src/lib/supabase.ts`, so GitHub Pages can build without private repository secrets. Publishable keys are designed for browser use only when paired with correctly configured RLS. Never substitute a secret key.

For local development, copy `.env.example` to `.env.local` and use the same public values.

## Migration history

The live project records these migrations in Supabase:

1. `campusfind_core_schema`
2. `tighten_profile_and_helper_permissions`
3. `index_remaining_foreign_keys`
4. `store_account_email_for_admin_directory`
5. `update_claim_counts_and_audit_events`
6. `enforce_report_and_claim_integrity`
7. `allow_admin_access_to_archived_reports`
8. `consolidate_catalog_select_policies`
9. `allow_owners_to_view_archived_reports`
10. `complete_report_audit_and_prevent_duplicate_claims`

No sample users, reports, claims, or audit rows are seeded into the live database.
