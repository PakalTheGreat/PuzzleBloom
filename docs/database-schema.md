# CWG — Database Schema (revised)

**Backend:** Supabase Postgres  
**Keys:** UUID primary keys (`gen_random_uuid()`) unless noted  
**Auth:** `auth.users.id` referenced by `public.users.id`  
**Source entities:** PRD domain model (§ Identity → Legal)

Conventions:

- `created_at` / `updated_at` timestamptz on mutable tables
- Soft-delete only where product needs recovery (`deleted_at`); hard-delete via LGPD workflows
- Enums as Postgres enums or checked text — listed as status sets below
- Money in BRL numeric(12,2); never store cannabis product SKUs/prices

---

## 1. Identity

### `users`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | = `auth.users.id` |
| email | text unique not null | mirrored from auth |
| full_name | text | |
| phone | text | E.164 or BR normalized |
| avatar_url | text | public avatar if set |
| locale | text default `pt-BR` | |
| timezone | text default `America/Sao_Paulo` | |
| active_role | text | last preferred: `grower` \| `specialist` |
| date_of_birth | date | optional; 18+ recorded separately |
| is_suspended | boolean default false | |
| created_at / updated_at | timestamptz | |

**RLS:** user reads/updates own row; admin read all.

### `user_roles`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK → users | |
| role | text | `grower` \| `specialist` \| `admin` |
| activated_at | timestamptz | |
| unique (user_id, role) | | |

### `grower_profiles`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid unique FK → users | |
| display_name | text | |
| organization_id | uuid FK → organizations nullable | |
| city / state / region | text | public region OK; **no exact cultivation address** |
| bio | text | |
| created_at / updated_at | timestamptz | |

### `specialist_profiles`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid unique FK → users | |
| slug | text unique not null | public URL key |
| headline | text | |
| bio | text | |
| photo_url | text | |
| city / state / region | text | |
| offers_remote | boolean | |
| offers_in_person | boolean | |
| years_experience | int | validated in app |
| verification_status | text | denormalized from latest verification (see §3) |
| membership_started_at | timestamptz | |
| last_active_at | timestamptz | discovery sort |
| created_at / updated_at | timestamptz | |

**Indexes:** `specialist_profiles (slug)`, `(state, city)`, `(verification_status)`, `(last_active_at desc)`.

### `organizations` / `organization_members`
Legal orgs that growers may belong to. Members: `organization_id`, `user_id`, `member_role`, unique `(organization_id, user_id)`. No public cultivation site coordinates.

---

## 2. Professional

### `specialties` / `specialist_specialties`
Catalog + M:N. `specialist_specialties`: unique `(specialist_profile_id, specialty_id)`, optional `is_primary`.

### `professional_credentials`
Education, qualifications, certifications, registrations. Fields: `specialist_profile_id`, `kind`, `title`, `issuer`, `credential_number`, `issued_on`, `expires_on`, `is_public` (default true for non-sensitive), `verified_by_admin`.

### `service_areas`
`specialist_profile_id`, `state`, `city` nullable, `region` nullable — discovery filters. **Not** street-level cultivation addresses.

### `professional_portfolio_items`
`specialist_profile_id`, `title`, `description`, `media_url`, `sort_order`, `is_public`.

---

## 3. Verification

Statuses: `unverified` | `pending_review` | `verified` | `rejected` | `suspended` | `expired`.

### `verification_requests`
`user_id`, `role_context` (`grower` \| `specialist`), `legal_category`, `specialty_id` nullable, `status`, `submitted_at`, `decided_at`.

### `verification_documents`
`request_id` FK, `storage_path` (private bucket), `doc_type`, `uploaded_at`. **Never** public; signed URL only for owner + admin reviewers.

### `verification_reviews`
Admin decision: `request_id`, `reviewer_id`, `decision`, `reason`, `created_at`.

### `verification_status_history`
Append-only: `user_id`, `from_status`, `to_status`, `actor_id`, `note`, `created_at`.

**Constraint notes:** only one `pending_review` request per `(user_id, role_context)` at a time (partial unique index). Public surfaces expose badge/status only — never document paths or reviewer notes.

**RLS:** owner CRUD own pending docs; admin full queue; anon/authenticated others: no document rows.

---

## 4. Discovery

### `saved_specialists` (favorites)
`grower_user_id`, `specialist_profile_id`, unique pair, private to grower.

### `profile_views`
`specialist_profile_id`, `viewer_user_id` nullable, `viewed_at`, `source` (`mobile` \| `web`). Aggregate for CRM analytics; no PII leak to other growers.

---

## 5. Services & calendar

### `service_categories`
Catalog for request types (professional services only — no product SKUs).

### `service_requests`
Grower → specialist intent: `grower_user_id`, `specialist_profile_id`, `category_id`, `mode` (`remote` \| `in_person`), `message`, `preferred_windows` jsonb, `status`, timestamps.

### `appointments`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| service_request_id | uuid FK nullable | |
| grower_user_id | uuid FK | |
| specialist_profile_id | uuid FK | |
| mode | text | remote \| in_person |
| starts_at / ends_at | timestamptz | timezone-aware; store UTC |
| timezone | text | e.g. America/Sao_Paulo |
| status | text | see transitions |
| location_summary | text | city/region or “remoto”; **no cultivation street address** |
| created_at / updated_at | timestamptz | |

**Statuses:** `pending` | `accepted` | `awaiting_confirmation` | `confirmed` | `completed` | `cancelled_by_grower` | `cancelled_by_specialist` | `rejected` | `expired`.

**Transition notes (enforce in RPC / Edge / constrained updates):**

| From | Allowed to |
| --- | --- |
| pending | accepted, rejected, cancelled_*, expired, awaiting_confirmation (suggest/clarify path) |
| accepted | awaiting_confirmation, confirmed, cancelled_*, expired |
| awaiting_confirmation | confirmed, cancelled_*, expired |
| confirmed | completed, cancelled_* |
| completed / rejected / expired / cancelled_* | terminal (no further status change) |

**Critical constraints:**

- No overlapping `confirmed`/`accepted`/`awaiting_confirmation` appointments for same specialist (`EXCLUDE` or deferrable check via trigger on `specialist_profile_id, tstzrange(starts_at,ends_at)`).
- Completion requires mutual confirmation record (see `service_confirmations`) before review eligibility.

### `availability_rules` / `availability_exceptions`
Rules: weekday, start/end time, mode, specialist. Exceptions: date overrides, vacation blocks. Nullable `external_calendar_event_id` reserved for future Google Calendar.

### `external_service_records`
Services completed outside the app but mutually acknowledged: `specialist_profile_id`, `counterparty_user_id`, `occurred_on`, `summary`, `status`. Feeds **external** reputation path only.

### `service_confirmations`
`appointment_id` **or** `external_service_record_id` (exactly one), `grower_confirmed_at`, `specialist_confirmed_at`. Review unlocks when both non-null.

---

## 6. Reputation (app vs external)

### Separation rule
- **App metrics:** derived only from reviews linked to `appointments` with mutual confirmation.
- **External metrics:** reviews linked to `external_service_records` only.
- Public profile shows both clearly separated (e.g. `rating_app`, `rating_external`, counts). Materialized view or maintained columns on `specialist_profiles` — **never** written by subscription jobs.

### `reviews`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| author_user_id | uuid FK | |
| specialist_profile_id | uuid FK | |
| appointment_id | uuid FK nullable | |
| external_service_record_id | uuid FK nullable | |
| origin | text | `app` \| `external` |
| score_professionalism | smallint 1–5 | |
| score_communication | smallint 1–5 | |
| score_punctuality | smallint 1–5 | |
| score_technical | smallint 1–5 | |
| score_organization | smallint 1–5 | |
| overall_score | numeric | computed average |
| body | text | |
| created_at | timestamptz | |

**Critical constraints:**

- Exactly one of `appointment_id` / `external_service_record_id` set; `origin` must match.
- `unique (appointment_id)` where not null — **no duplicate reviews per interaction**.
- `unique (external_service_record_id)` where not null.
- `author_user_id <> specialist.user_id` — no self-review (trigger).
- Insert only if matching `service_confirmations` both sides set.

### `review_responses`
Specialist reply: `review_id` unique, `body`, timestamps.

### `review_reports` / `review_moderation_events`
Reporting + admin moderation audit. Rate limits at Edge/API layer.

---

## 7. Messaging

### `conversations` / `conversation_members` / `messages`
Members unique `(conversation_id, user_id)`. Messages: `sender_id`, `body`, `sent_at`, `read_at` nullable.

### `message_attachments` (schema ready; UI deferred)
Private storage paths; RLS via conversation membership.

### `message_reports`
Reporter, message_id, reason. Admins: no default unrestricted inbox access — only reported threads / explicit tools.

---

## 8. CRM (specialist-private)

### `crm_clients`
`specialist_profile_id`, `grower_user_id` nullable (manual lead), `display_name`, `status` (`lead` \| `active` \| `inactive` \| `archived`), contact fields, unique `(specialist_profile_id, grower_user_id)` when grower set.

### `crm_client_notes` / `crm_tasks` / `crm_service_records` / `crm_attachments`
Notes and tasks private to owning specialist. Tasks: priority, due_at, done_at. Attachments deferred UI; private bucket. **RLS:** specialist owner only — never grower-readable, never public.

---

## 9. Notifications

### `notifications`
`user_id`, `type`, `payload` jsonb, `read_at`, `created_at`. Deduplicate by business key where needed (e.g. one reminder per appointment).

### `notification_preferences`
Per user / channel (`push` \| `in_app` \| `email`) / category.

### `push_tokens`
`user_id`, `token`, `platform`, `updated_at`; unique token.

No reminders for cancelled/terminal appointments (enforced in scheduler job).

---

## 10. Subscriptions

### `subscription_plans` / `plan_features`
Plan code (`free` \| `pro` \| `premium`), price_brl, features as key/value limits (CRM caps, analytics). **No feature key may write reputation columns.**

### `subscriptions`
`specialist_profile_id`, `plan_id`, `status`, `current_period_start/end`, `cancel_at`.

### `payments` / `subscription_events`
Payments deferred live processing; keep rows for webhook readiness. Events append-only for audit.

**Invariant:** jobs that expire subscriptions must not delete or alter reviews, verification, or history.

---

## 11. Legal & trust

### `terms_acceptances` / `privacy_consents`
`user_id`, `document_version`, `accepted_at`, `ip` / `user_agent` metadata as policy allows.

### `age_confirmations`
`user_id`, `confirmed_18_plus`, `confirmed_at` — recorded; not legal authorization to cultivate.

### `audit_logs`
Actor, action, entity_type, entity_id, payload, created_at — admin/security sensitive.

### `user_reports`
Reporter, subject_user_id, reason, status.

### `account_deletion_requests`
User request, status, processed_at — LGPD workflow.

---

## 12. Reputation aggregates (derived)

Suggested maintained columns or view `specialist_reputation_stats`:

| Field | Source |
| --- | --- |
| rating_app / reviews_count_app | origin = app |
| rating_external / reviews_count_external | origin = external |
| confirmed_appointments_count | appointments status = completed |
| rating_overall | documented formula (weighted or separate display — product prefers **separate** display) |

Subscriptions / payments **forbidden** as writers of this view/table.

---

## 13. Index & constraint checklist (critical)

- UUID PKs everywhere above.
- Unique specialist `slug`; unique favorites pair; unique review per appointment / external record.
- Partial unique pending verification per user+role.
- Appointment overlap exclusion for active statuses.
- FK cascades: prefer restrict on reputation/legal; cascade soft membership rows as designed.
- RLS outlines: owner / participant / admin patterns per section; private storage paths never in public selects.

---

## 14. Out of schema scope

- Cannabis product catalog, inventory, delivery, or product checkout tables.
- Public cultivation site addresses.
- Live payment provider columns beyond generic `payments` provider refs (add when integrating).
