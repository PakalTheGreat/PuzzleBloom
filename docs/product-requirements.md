# CWG — Connect With Growers
## Product Requirements (revised)

Source: Lucas brief (chat). Sections 1–21 captured below. **Section 22+ was truncated in the incoming message** — phases below are inferred until Lucas pastes the remainder.

---

### Vision
Mobile-first professional ecosystem: Superprof discovery + LinkedIn reputation + lightweight CRM + marketplace scheduling. Connects legally authorized Brazilian growers/orgs with qualified technical specialists. **Not** a cannabis product marketplace (no listings, sales, delivery, or payments for controlled materials).

One brand, one database, two experiences (grower / specialist). Single account may activate both roles; switch without logout. UI always shows active role.

### Platforms & stack
| Layer | Choice |
|-------|--------|
| Mobile (primary) | React Native, Expo, TypeScript, Expo Router, TanStack Query, React Hook Form, Zod, Expo Notifications, Expo SecureStore |
| Web (complementary) | Next.js, TypeScript, Tailwind, reusable components — landing, public profiles/SEO, admin, sharing |
| Backend | Supabase Auth, Postgres, Storage, Realtime, Edge Functions, RLS |
| Structure | Monorepo: `apps/mobile`, `apps/web`, `packages/{shared,types,validation,api,ui}`, `supabase/{migrations,functions,seed}`, `docs/` |

Shared packages for types, Zod, validation, API clients, domain logic, constants, permissions. Presentation layers independent.

### Design
Professional SaaS: neutral backgrounds, dark graphite / deep green, clear accent, clean type, consistent spacing, subtle shadows, moderate radius. No recreational cannabis imagery. Mobile-first; loading/empty/error/success states; pt-BR; BRL; Brazilian date/phone/address formats.

### Auth & onboarding
Email/password, recovery, email verification, session, logout, deletion request, settings, notification/privacy prefs. Google auth later. Role selection: find specialists / offer services / both. Age 18+ confirmation recorded (not legal authorization). Versioned ToS/Privacy acceptance with audit metadata.

### Verification & trust
Configurable workflows by legal category / specialty. Statuses: Unverified, Pending review, Verified, Rejected, Suspended, Expired. Admin review with reasons and history. Documents in private storage only; public shows badge only (not government endorsement). Never expose ID docs, full authorizations, private addresses, cultivation info, internal notes.

### Specialist public profile
URL: `cwg.com.br/tecnicos/[slug]` — works in browser without app install. Photo, name, headline, bio, region, remote/in-person, specialties, education, qualifications, certifications, registrations, years experience (validated), verification, portfolio, rating, verified reviews count, confirmed appointments count, membership date, CTA. Reputation from DB only; subscriptions never alter ratings/counts/verification.

### Discovery (growers)
Filters: specialty, city, state, region, remote, in-person, verification, min rating, experience, availability, qualifications. Sort: relevance, rating, reviews, appointments, recently active, distance (only with authorized location). Favorites private. Cards scannable on mobile.

### Appointments
Remote and in-person professional services only. Request → accept/decline/suggest/clarify → confirm. Statuses: Pending, Accepted, Awaiting confirmation, Confirmed, Completed, Cancelled by grower/specialist, Rejected, Expired. Valid transitions; timezone-aware (Brazil); no double-booking vs availability. No controlled-material facilitation.

### Reputation
Reviews only after mutual completion confirmation (or mutually confirmed external service). Separate metrics: app-originated vs external. Dimensions: professionalism, communication, punctuality, technical knowledge, organization. Anti-fraud: one review per interaction, no self-review, rate limits, reporting, moderation. Specialist may respond. No paid rating manipulation.

### Messaging
Conversations, history, timestamps, read status, text; attachments later with private storage. Report/block. Admins no default unrestricted access. Do not invasively block off-platform contact. Reputation/history remain accessible if subscription expires.

### Specialist CRM (mobile differentiator)
Dashboard: clients, new clients, upcoming appointments, pending requests, completed/cancelled, tasks, profile views, leads, rating, recent reviews. Clients: lead/active/inactive/archived; notes private; service history; tasks with priority/due date. Fast authorized search. Never public or grower-visible.

### Calendar
Day/week/month/agenda. Availability rules + exceptions; vacation; remote/in-person. Visual indicators for appointment types. Manual appointments and blocks. Google Calendar later (design hooks only).

### Notifications
Expo push + in-app (+ email where implemented). Preferences per channel. Specialist: requests, messages, confirmations, reminders, reschedules, cancels, reviews, verification, subscription. Grower: responses, confirmations, reminders, reschedules, cancels, messages, verification. No duplicates; no reminders for cancelled.

### Subscriptions (specialists pay)
Free / Pro ~R$49.90 / Premium ~R$99.90 — configurable entitlements. Free usable (limited CRM). Reputation, reviews, history never deleted for non-payment. Paid visibility labeled if introduced. Payments later phase; architecture ready.

### Admin web
Separate area; backend-enforced permissions. Users, verification queue, moderation, specialties/categories, config, subscriptions overview, audit logs.

### Domain model (initial)
Identity: users, user_roles, grower_profiles, specialist_profiles, organizations, organization_members. Professional: specialties, specialist_specialties, professional_credentials, service_areas, professional_portfolio_items. Verification: verification_requests/documents/reviews/status_history. Discovery: saved_specialists, profile_views. Services: service_categories, service_requests, appointments, availability_rules/exceptions, external_service_records, service_confirmations. Reputation: reviews, review_responses, review_reports, review_moderation_events. Messaging: conversations, conversation_members, messages, message_attachments, message_reports. CRM: crm_clients, crm_client_notes, crm_service_records, crm_tasks, crm_attachments. Notifications: notifications, notification_preferences, push_tokens. Subscriptions: subscription_plans, plan_features, subscriptions, payments, subscription_events. Legal: terms_acceptances, privacy_consents, audit_logs, user_reports, account_deletion_requests.

### Security / LGPD
RLS everywhere for private data; signed URLs for private files; validation; rate limits; audit; secrets out of git; minimization; deletion workflows; no exact cultivation addresses; legal review before production.

### Mobile nav
Specialist tabs: Dashboard, Agenda, Clientes, Solicitações, Perfil (+ messages/tasks/analytics/settings). Grower tabs: Explorar, Favoritos, Agendamentos, Mensagens, Perfil. Adapt to active role.

### Screens
Auth, onboarding, grower app, specialist app, web public + admin — as listed in brief §21.

### Phases (provisional until §22 arrives)
1. Monorepo + auth + roles + profiles + verification submit + web public directory/profile + mobile explore basics  
2. Requests, appointments, calendar basics, favorites, reputation pipeline  
3. CRM, messaging, push, subscriptions architecture, analytics  
4. Admin, moderation, security/LGPD, tests, deploy  

---

**Open decisions for Lucas:** GitHub repo URL; Supabase project; paste remainder of §22+ if different from provisional phases.
