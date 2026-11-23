import type { AppRole, DemoSession } from "./types";

export const DEMO_SPECIALISTS = [
  {
    id: "sp-ana",
    user_id: "user-ana",
    slug: "ana-tecnicas",
    headline: "Consultoria em cultivo indoor e compliance",
    bio: "Engenheira agrônoma com foco em boas práticas, SOP e auditoria documental para cultivadores autorizados.",
    city: "Curitiba",
    state: "PR",
    region: "Sul",
    verification_status: "verified",
    offers_remote: true,
    offers_in_person: true,
    users: { full_name: "Ana Ribeiro", avatar_url: null },
    specialist_specialties: [
      { specialties: { name_pt: "Cultivo indoor" } },
      { specialties: { name_pt: "Compliance" } },
    ],
  },
  {
    id: "sp-bruno",
    user_id: "user-bruno",
    slug: "bruno-lab",
    headline: "Laboratório e análise de qualidade",
    bio: "Especialista em amostragem, laudos e interpretação de resultados para organizações autorizadas.",
    city: "São Paulo",
    state: "SP",
    region: "Sudeste",
    verification_status: "verified",
    offers_remote: true,
    offers_in_person: false,
    users: { full_name: "Bruno Mendes", avatar_url: null },
    specialist_specialties: [
      { specialties: { name_pt: "Análise laboratorial" } },
      { specialties: { name_pt: "Qualidade" } },
    ],
  },
  {
    id: "sp-exemplo",
    user_id: "user-exemplo",
    slug: "exemplo",
    headline: "Perfil demonstração CWG",
    bio: "Este é um perfil público de demonstração para o protótipo Connect With Growers.",
    city: "Florianópolis",
    state: "SC",
    region: "Sul",
    verification_status: "pending_review",
    offers_remote: true,
    offers_in_person: true,
    users: { full_name: "Especialista Exemplo", avatar_url: null },
    specialist_specialties: [{ specialties: { name_pt: "Consultoria geral" } }],
  },
] as const;

export const DEMO_CRM_CLIENTS = [
  {
    id: "crm-1",
    specialist_profile_id: "sp-ana",
    display_name: "Associação Verde Legal",
    status: "active",
    email: "contato@verdelegal.demo",
    phone: "+55 41 99999-1001",
    notes: "Cliente recorrente — SOP trimestral.",
  },
  {
    id: "crm-2",
    specialist_profile_id: "sp-ana",
    display_name: "Fazenda Horizonte",
    status: "lead",
    email: "ops@horizonte.demo",
    phone: null,
    notes: "Lead via diretório. Quer visita presencial.",
  },
  {
    id: "crm-3",
    specialist_profile_id: "sp-ana",
    display_name: "Org. CannaSul",
    status: "active",
    email: "admin@cannasul.demo",
    phone: "+55 48 98888-2200",
    notes: "Contrato anual de acompanhamento remoto.",
  },
];

export const DEMO_CRM_NOTES = [
  {
    id: "note-1",
    client_id: "crm-1",
    body: "Entrega de checklist LGPD concluída.",
    created_at: "2026-11-18T14:00:00.000Z",
  },
  {
    id: "note-2",
    client_id: "crm-1",
    body: "Agendar revisão de SOP em dezembro.",
    created_at: "2026-11-20T10:30:00.000Z",
  },
];

export const DEMO_CRM_TASKS = [
  {
    id: "task-1",
    client_id: "crm-1",
    title: "Enviar relatório mensal",
    status: "open",
    due_at: "2026-11-28T18:00:00.000Z",
  },
  {
    id: "task-2",
    client_id: "crm-2",
    title: "Ligar para confirmar visita",
    status: "open",
    due_at: "2026-11-25T15:00:00.000Z",
  },
];

function isoDaysFromNow(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const DEMO_APPOINTMENTS = [
  {
    id: "apt-1",
    status: "confirmed",
    starts_at: isoDaysFromNow(2, 9),
    ends_at: isoDaysFromNow(2, 10),
    mode: "remote",
    location_summary: "Google Meet",
    grower_user_id: "user-carlos",
    specialist_profile_id: "sp-ana",
    specialist_profiles: {
      slug: "ana-tecnicas",
      headline: "Consultoria em cultivo indoor e compliance",
      users: { full_name: "Ana Ribeiro" },
    },
    service_confirmations: [
      {
        id: "sc-1",
        grower_confirmed_at: null,
        specialist_confirmed_at: null,
      },
    ],
  },
  {
    id: "apt-2",
    status: "completed",
    starts_at: isoDaysFromNow(-5, 14),
    ends_at: isoDaysFromNow(-5, 15),
    mode: "in_person",
    location_summary: "Curitiba — sala técnica",
    grower_user_id: "user-carlos",
    specialist_profile_id: "sp-ana",
    specialist_profiles: {
      slug: "ana-tecnicas",
      headline: "Consultoria em cultivo indoor e compliance",
      users: { full_name: "Ana Ribeiro" },
    },
    service_confirmations: [
      {
        id: "sc-2",
        grower_confirmed_at: isoDaysFromNow(-4, 16),
        specialist_confirmed_at: isoDaysFromNow(-4, 16),
      },
    ],
  },
  {
    id: "apt-3",
    status: "requested",
    starts_at: isoDaysFromNow(5, 11),
    ends_at: isoDaysFromNow(5, 12),
    mode: "remote",
    location_summary: null,
    grower_user_id: "user-carlos",
    specialist_profile_id: "sp-bruno",
    specialist_profiles: {
      slug: "bruno-lab",
      headline: "Laboratório e análise de qualidade",
      users: { full_name: "Bruno Mendes" },
    },
    service_confirmations: [],
  },
];

export const DEMO_REQUESTS = [
  {
    id: "req-1",
    status: "pending",
    mode: "remote",
    message: "Preciso de revisão de SOP para auditoria interna.",
    created_at: isoDaysFromNow(-1, 9),
    grower_user_id: "user-carlos",
    specialist_profile_id: "sp-ana",
    users: { full_name: "Carlos Oliveira", email: "carlos@demo.cwg" },
    specialist_profiles: {
      slug: "ana-tecnicas",
      headline: "Consultoria em cultivo indoor e compliance",
      users: { full_name: "Ana Ribeiro" },
    },
  },
  {
    id: "req-2",
    status: "accepted",
    mode: "in_person",
    message: "Visita técnica para layout de sala.",
    created_at: isoDaysFromNow(-3, 15),
    grower_user_id: "user-carlos",
    specialist_profile_id: "sp-ana",
    users: { full_name: "Carlos Oliveira", email: "carlos@demo.cwg" },
    specialist_profiles: {
      slug: "ana-tecnicas",
      headline: "Consultoria em cultivo indoor e compliance",
      users: { full_name: "Ana Ribeiro" },
    },
  },
];

export const DEMO_FAVORITES = [
  {
    id: "fav-1",
    specialist_profiles: {
      id: "sp-ana",
      slug: "ana-tecnicas",
      headline: "Consultoria em cultivo indoor e compliance",
      city: "Curitiba",
      state: "PR",
      verification_status: "verified",
      users: { full_name: "Ana Ribeiro" },
    },
  },
  {
    id: "fav-2",
    specialist_profiles: {
      id: "sp-bruno",
      slug: "bruno-lab",
      headline: "Laboratório e análise de qualidade",
      city: "São Paulo",
      state: "SP",
      verification_status: "verified",
      users: { full_name: "Bruno Mendes" },
    },
  },
];

export const DEMO_CONVERSATIONS = [
  {
    id: "conv-1",
    latest: {
      body: "Podemos marcar a revisão de SOP na quinta?",
      sent_at: isoDaysFromNow(-0, 11),
    },
    members: [{ users: { full_name: "Ana Ribeiro", email: "ana@demo.cwg" } }],
  },
  {
    id: "conv-2",
    latest: {
      body: "Enviei o protocolo de amostragem.",
      sent_at: isoDaysFromNow(-2, 16),
    },
    members: [{ users: { full_name: "Bruno Mendes", email: "bruno@demo.cwg" } }],
  },
];

export const DEMO_MESSAGES: Record<
  string,
  Array<{ id: string; body: string; sent_at: string; sender_label: string }>
> = {
  "conv-1": [
    {
      id: "m1",
      body: "Olá Ana, vi seu perfil no CWG.",
      sent_at: isoDaysFromNow(-1, 10),
      sender_label: "Carlos Oliveira",
    },
    {
      id: "m2",
      body: "Olá Carlos! Posso ajudar com compliance e SOP.",
      sent_at: isoDaysFromNow(-1, 10) ,
      sender_label: "Ana Ribeiro",
    },
    {
      id: "m3",
      body: "Podemos marcar a revisão de SOP na quinta?",
      sent_at: isoDaysFromNow(0, 11),
      sender_label: "Carlos Oliveira",
    },
  ],
  "conv-2": [
    {
      id: "m4",
      body: "Bruno, preciso de um laudo de qualidade.",
      sent_at: isoDaysFromNow(-2, 15),
      sender_label: "Carlos Oliveira",
    },
    {
      id: "m5",
      body: "Enviei o protocolo de amostragem.",
      sent_at: isoDaysFromNow(-2, 16),
      sender_label: "Bruno Mendes",
    },
  ],
};

export const DEMO_AVAILABILITY_RULES = [
  {
    id: "rule-1",
    weekday: 1,
    start_time: "09:00",
    end_time: "17:00",
    mode: "remote",
  },
  {
    id: "rule-2",
    weekday: 3,
    start_time: "10:00",
    end_time: "16:00",
    mode: "in_person",
  },
  {
    id: "rule-3",
    weekday: 5,
    start_time: "09:00",
    end_time: "12:00",
    mode: "remote",
  },
];

export const DEMO_EXCEPTIONS = [
  {
    id: "ex-1",
    exception_date: new Date().toISOString().slice(0, 10),
    note: "Bloqueio demonstração",
  },
];

export const DEMO_ADMIN_PENDING = [
  {
    id: "vr-1",
    user_id: "user-exemplo",
    role_context: "specialist",
    status: "pending_review",
    submitted_at: isoDaysFromNow(-2, 12),
    legal_category: "associacao",
  },
];

export const DEMO_ADMIN_REPORTS = [
  {
    id: "rr-1",
    reason: "Linguagem inadequada na review",
    status: "open",
    created_at: isoDaysFromNow(-1, 8),
    review_id: "rev-1",
    reporter_user_id: "user-ana",
  },
];

export const DEMO_STATS = {
  appointmentsMonth: 12,
  confirmedRate: 0.92,
  avgRating: 4.8,
  activeClients: 8,
  responseHours: 4.2,
};

export type DemoPersona = "specialist" | "grower" | "admin" | "both";

export const DEMO_PERSONAS: Record<
  DemoPersona,
  {
    label: string;
    email: string;
    password: string;
    session: DemoSession;
  }
> = {
  specialist: {
    label: "Especialista (Ana)",
    email: "ana@demo.cwg",
    password: "demo1234",
    session: {
      userId: "user-ana",
      email: "ana@demo.cwg",
      fullName: "Ana Ribeiro",
      roles: ["specialist"],
      activeRole: "specialist",
      onboardingComplete: true,
      specialistProfileId: "sp-ana",
      growerProfileId: null,
    },
  },
  grower: {
    label: "Cultivador (Carlos)",
    email: "carlos@demo.cwg",
    password: "demo1234",
    session: {
      userId: "user-carlos",
      email: "carlos@demo.cwg",
      fullName: "Carlos Oliveira",
      roles: ["grower"],
      activeRole: "grower",
      onboardingComplete: true,
      specialistProfileId: null,
      growerProfileId: "gp-carlos",
    },
  },
  admin: {
    label: "Admin",
    email: "admin@demo.cwg",
    password: "demo1234",
    session: {
      userId: "user-admin",
      email: "admin@demo.cwg",
      fullName: "Admin CWG",
      roles: ["admin", "specialist"],
      activeRole: "admin",
      onboardingComplete: true,
      specialistProfileId: "sp-ana",
      growerProfileId: null,
    },
  },
  both: {
    label: "Ambos os papéis",
    email: "ambos@demo.cwg",
    password: "demo1234",
    session: {
      userId: "user-ambos",
      email: "ambos@demo.cwg",
      fullName: "Lia Dual",
      roles: ["grower", "specialist"],
      activeRole: "specialist",
      onboardingComplete: true,
      specialistProfileId: "sp-ana",
      growerProfileId: "gp-lia",
    },
  },
};

export function findDemoPersonaByEmail(
  email: string,
  password: string,
): DemoSession | null {
  const normalized = email.trim().toLowerCase();
  for (const persona of Object.values(DEMO_PERSONAS)) {
    if (persona.email === normalized && persona.password === password) {
      return { ...persona.session };
    }
  }
  return null;
}

export function exploreDemoSpecialists(opts?: { estado?: string; q?: string }) {
  const q = (opts?.q ?? "").trim().toLowerCase();
  const estado = (opts?.estado ?? "").trim().toUpperCase();
  return DEMO_SPECIALISTS.filter((row) => {
    if (estado && row.state !== estado) return false;
    if (!q) return true;
    const hay = `${row.users.full_name} ${row.headline} ${row.slug} ${row.city}`.toLowerCase();
    return hay.includes(q);
  });
}

export function getDemoSpecialistBySlug(slug: string) {
  return DEMO_SPECIALISTS.find((s) => s.slug === slug) ?? null;
}

export function isSpecialistActive(session: DemoSession | null): boolean {
  return Boolean(session && session.activeRole === "specialist");
}

export function isGrowerActive(session: DemoSession | null): boolean {
  return Boolean(session && session.activeRole === "grower");
}

export function isAdmin(session: DemoSession | null): boolean {
  return Boolean(session?.roles.includes("admin"));
}

export function hasRole(session: DemoSession | null, role: AppRole): boolean {
  return Boolean(session?.roles.includes(role));
}
