-- CWG: deferred Phase 2+ tables (stubs / comments only)
-- Implement fully when those phases start. Do NOT invent product commerce tables.

-- Phase 2 — discovery / services / reputation (outline):
--   saved_specialists, profile_views
--   service_categories, service_requests, appointments
--   availability_rules, availability_exceptions
--   external_service_records, service_confirmations
--   reviews, review_responses, review_reports, review_moderation_events
--   specialist_reputation_stats (derived; NEVER written by subscription jobs)

-- Phase 3 — messaging / CRM / notifications:
--   conversations, conversation_members, messages, message_attachments, message_reports
--   crm_clients, crm_client_notes, crm_tasks, crm_service_records, crm_attachments
--   notifications, notification_preferences, push_tokens
--   private storage buckets: crm-attachments, message-attachments

-- Phase 4 — trust / admin hardening:
--   user_reports, moderation tooling, LGPD deletion automation

-- Permanent non-goals:
--   cannabis product catalog, inventory, delivery, product checkout

select 1;
