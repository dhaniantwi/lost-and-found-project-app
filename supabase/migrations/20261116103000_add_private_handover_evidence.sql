-- Store the private Storage object path for administrator-recorded handover evidence.
alter table public.claims
  add column if not exists handover_evidence_path text;

comment on column public.claims.handover_evidence_path is
  'Private claim-evidence storage path for administrator-uploaded physical handover proof; accessible only to authorized CampusFind administrators.';
