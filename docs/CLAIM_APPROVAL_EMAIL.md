# Claim approval email

This branch routes administrator claim approvals through the `campusfind-approve-claim` Supabase Edge Function.

## Behaviour

- Requires a valid signed-in Supabase user and checks the trusted `profiles.role = 'admin'` value server-side.
- Accepts only a claim ID, administrator notes and collection location from the browser.
- Reads the claimant's email from Supabase Auth (never from the browser request).
- Generates an eight-digit code server-side and sets a 48-hour expiry.
- Sends the code and collection instructions through the CampusFind Gmail SMTP account.
- Marks the claim approved only for a pending claim. If SMTP fails, it attempts to restore the claim to pending and invalidate the code.
- Writes an audit entry after successful delivery.

## Deployment after reviewing and merging

The Gmail secrets were already added to the CampusFind Supabase project:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

The function also uses the standard Supabase environment variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

Deploy this function to project `ixpffnxjdprijkfifkfo` with JWT verification enabled:

```bash
supabase functions deploy campusfind-approve-claim --project-ref ixpffnxjdprijkfifkfo
```

Do not deploy the function before the frontend branch is reviewed and merged. Keep the Gmail app password and service-role key out of the repository and browser code.

## Important compatibility note

The current CampusFind claims schema and handover UI still use the existing `collection_code` column. This implementation moves code generation and approval/email orchestration to the server, but it does **not** yet replace plaintext code storage with a hash or move the collection-code verification step server-side. Treat that as a required security-hardening follow-up before production use with sensitive claims. Do not describe this branch as completing that hardening.
