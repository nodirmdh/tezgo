-- Ensure CRM notes are unique per client for UPSERT

CREATE UNIQUE INDEX IF NOT EXISTS uq_client_crm_notes_client_user_id
  ON client_crm_notes(client_user_id);
