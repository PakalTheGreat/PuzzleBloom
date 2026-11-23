/** Versioned legal documents — bump when copy changes; store acceptance with this version. */
export const LEGAL_VERSIONS = {
  terms: "2026-03-23",
  privacy: "2026-03-23",
  /** Declaração pré-auth de autorização aplicável — não valida legalidade. */
  cultivationAuthorization: "2026-11-23",
} as const;

export const LEGAL_COPY = {
  termsTitle: "Termos de Uso",
  privacyTitle: "Política de Privacidade",
  ageTitle: "Confirmação de idade",
  ageBody:
    "Confirmo que tenho 18 anos ou mais. Esta confirmação é registrada na conta e não constitui autorização legal para cultivo.",
  termsSummary:
    "Ao continuar, você concorda com os Termos de Uso do CWG (versão vigente). O CWG é uma plataforma de serviços profissionais — não marketplace de produtos.",
  privacySummary:
    "Tratamos dados conforme a LGPD. Documentos de verificação ficam em armazenamento privado; perfis públicos expõem apenas campos autorizados.",
  cultivationAuthTitle: "Declaração de autorização aplicável",
  cultivationAuthBody:
    "Antes de criar ou acessar uma conta, declare que, no contexto da sua atividade (cultivo, pesquisa, associação, assistência técnica ou outro uso profissional), você possui — ou atuará apenas sob — a autorização aplicável emitida pelas autoridades competentes, quando a legislação exigir.",
  cultivationAuthDisclaimer:
    "O CWG não verifica, valida nem concede autorizações legais. Esta declaração é prestada sob sua responsabilidade e não substitui licenças, alvarás, decisões judiciais ou outros atos oficiais. O uso da plataforma não implica conformidade legal do usuário.",
  cultivationAuthCheckbox:
    "Declaro que tenho ciência do acima e que possuo (ou atuarei apenas sob) a autorização aplicável das autoridades competentes, quando exigida pela legislação vigente no meu contexto.",
  cultivationAuthDecline: "Não posso declarar agora",
  cultivationAuthContinue: "Concordo e continuar",
} as const;

/** Placeholder until the real Play listing exists. Override via env. */
export const DEFAULT_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=br.com.cwg.app";
